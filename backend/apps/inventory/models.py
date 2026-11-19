from django.db import models, transaction
from apps.core.models import BaseModel
from apps.catalog.models import ProductVariant
from apps.accounts.models import User

class StockRecord(BaseModel):
    """Real-time inventory counter for a product variant."""
    variant = models.OneToOneField(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name='stock_record'
    )
    quantity_available = models.PositiveIntegerField(
        default=0,
        help_text="Units ready for immediate sale"
    )
    quantity_reserved = models.PositiveIntegerField(
        default=0,
        help_text="Units temporarily locked in pending checkouts"
    )
    low_stock_threshold = models.PositiveIntegerField(
        default=2,
        help_text="Triggers alert when available quantity drops below this"
    )

    class Meta:
        verbose_name = 'Stock Record'
        verbose_name_plural = 'Stock Records'

    def __str__(self):
        return f"{self.variant.sku}: {self.quantity_available} avail / {self.quantity_reserved} rsvd"

    @property
    def is_available(self):
        return self.quantity_available > 0

    @property
    def is_low_stock(self):
        return self.quantity_available <= self.low_stock_threshold

    @transaction.atomic
    def reserve(self, qty: int, reason: str = "Cart reservation", actor: User = None) -> bool:
        """Lock quantity during checkout creation."""
        record = StockRecord.objects.select_for_update().get(pk=self.pk)
        if record.quantity_available < qty:
            return False

        old_avail = record.quantity_available
        record.quantity_available -= qty
        record.quantity_reserved += qty
        record.save()

        StockMovementLog.objects.create(
            variant=self.variant,
            movement_type='RESERVE',
            quantity_changed=qty,
            previous_quantity=old_avail,
            new_quantity=record.quantity_available,
            reason=reason,
            actor=actor
        )
        return True

    @transaction.atomic
    def release(self, qty: int, reason: str = "Order cancelled / expired", actor: User = None) -> bool:
        """Release reserved quantity back to available stock."""
        record = StockRecord.objects.select_for_update().get(pk=self.pk)
        qty_to_release = min(qty, record.quantity_reserved)

        old_avail = record.quantity_available
        record.quantity_reserved -= qty_to_release
        record.quantity_available += qty_to_release
        record.save()

        StockMovementLog.objects.create(
            variant=self.variant,
            movement_type='RELEASE',
            quantity_changed=qty_to_release,
            previous_quantity=old_avail,
            new_quantity=record.quantity_available,
            reason=reason,
            actor=actor
        )
        return True

    @transaction.atomic
    def fulfill(self, qty: int, reason: str = "Order payment completed", actor: User = None) -> bool:
        """Deduct reserved stock permanently upon confirmed payment."""
        record = StockRecord.objects.select_for_update().get(pk=self.pk)
        qty_to_deduct = min(qty, record.quantity_reserved)

        record.quantity_reserved -= qty_to_deduct
        record.save()

        StockMovementLog.objects.create(
            variant=self.variant,
            movement_type='FULFILL',
            quantity_changed=-qty_to_deduct,
            previous_quantity=record.quantity_available,
            new_quantity=record.quantity_available,
            reason=reason,
            actor=actor
        )
        return True

    @transaction.atomic
    def restock(self, qty: int, reason: str = "Stock restock", actor: User = None):
        """Add new stock inventory."""
        record = StockRecord.objects.select_for_update().get(pk=self.pk)
        old_avail = record.quantity_available
        record.quantity_available += qty
        record.save()

        StockMovementLog.objects.create(
            variant=self.variant,
            movement_type='RESTOCK',
            quantity_changed=qty,
            previous_quantity=old_avail,
            new_quantity=record.quantity_available,
            reason=reason,
            actor=actor
        )


class StockMovementLog(BaseModel):
    """Audit trail of all inventory events."""
    MOVEMENT_CHOICES = (
        ('INITIAL', 'Initial Stock Entry'),
        ('RESTOCK', 'Restocked'),
        ('RESERVE', 'Checkout Reservation'),
        ('RELEASE', 'Reservation Released'),
        ('FULFILL', 'Order Fulfillment'),
        ('ADJUSTMENT', 'Manual Inventory Correction'),
    )

    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, related_name='movement_logs')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_CHOICES, db_index=True)
    quantity_changed = models.IntegerField(help_text="Positive for addition, negative for deduction")
    previous_quantity = models.IntegerField()
    new_quantity = models.IntegerField()
    reason = models.TextField(blank=True)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name = 'Stock Movement Log'
        verbose_name_plural = 'Stock Movement Logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.variant.sku} | {self.movement_type}: {self.quantity_changed}"

