from django.db import models
from apps.core.models import BaseModel
from apps.core.utils import generate_order_number, normalize_cameroon_phone
from apps.catalog.models import ProductVariant
from apps.accounts.models import User

class Order(BaseModel):
    """Customer order entity."""
    ORDER_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('AWAITING_PAYMENT', 'Awaiting Payment'),
        ('PAID', 'Paid'),
        ('PROCESSING', 'Processing'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
        ('REFUNDED', 'Refunded'),
    )

    PAYMENT_STATUS_CHOICES = (
        ('PENDING', 'Pending Payment'),
        ('PAID', 'Paid'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    )

    FULFILLMENT_STATUS_CHOICES = (
        ('UNFULFILLED', 'Unfulfilled'),
        ('PROCESSING', 'Processing & Luxury Inspection'),
        ('DISPATCHED_TO_AGENCY', 'Dispatched to Transport Agency'),
        ('OUT_FOR_DELIVERY', 'Out for Courier Delivery'),
        ('DELIVERED', 'Delivered to Customer'),
        ('CANCELLED', 'Cancelled'),
    )

    DELIVERY_METHOD_CHOICES = (
        ('DOORSTEP_EXPRESS', 'Doorstep Express Delivery'),
        ('AGENCY_PICKUP', 'Agency Pickup (Touristique / Buca / Finexs)'),
        ('SHOWROOM_COLLECTION', 'Showroom Boutique Collection'),
    )

    order_number = models.CharField(max_length=32, unique=True, default=generate_order_number, db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    customer_name = models.CharField(max_length=150, blank=True)
    customer_email = models.EmailField(blank=True)
    customer_phone = models.CharField(max_length=30)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, help_text="Items subtotal in FCFA")
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Discount amount in FCFA")
    shipping_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Shipping fee in FCFA")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Grand total in FCFA")
    currency = models.CharField(max_length=5, default='XAF')
    order_status = models.CharField(max_length=30, choices=ORDER_STATUS_CHOICES, default='PENDING', db_index=True)
    payment_status = models.CharField(max_length=30, choices=PAYMENT_STATUS_CHOICES, default='PENDING', db_index=True)
    fulfillment_status = models.CharField(max_length=30, choices=FULFILLMENT_STATUS_CHOICES, default='UNFULFILLED', db_index=True)
    delivery_method = models.CharField(max_length=30, choices=DELIVERY_METHOD_CHOICES, default='DOORSTEP_EXPRESS')
    customer_notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order_number} — {self.customer_phone} ({self.total_amount} FCFA)"

    def save(self, *args, **kwargs):
        if self.customer_phone:
            self.customer_phone = normalize_cameroon_phone(self.customer_phone)
        super().save(*args, **kwargs)


class OrderItem(BaseModel):
    """Historical snapshot of an item ordered."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, related_name='order_items')
    product_name = models.CharField(max_length=255)
    variant_title = models.CharField(max_length=150)
    sku = models.CharField(max_length=100)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField()
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'

    def __str__(self):
        return f"{self.quantity}x {self.product_name} ({self.variant_title})"


class OrderAddress(BaseModel):
    """Snapshot of recipient delivery address at order placement."""
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='shipping_address')
    recipient_name = models.CharField(max_length=150)
    primary_phone = models.CharField(max_length=30)
    backup_phone = models.CharField(max_length=30, blank=True)
    region = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    neighborhood = models.CharField(max_length=150)
    landmark = models.TextField(blank=True)
    additional_instructions = models.TextField(blank=True, help_text="Delivery notes, access code, concierge directions")
    agency_name = models.CharField(max_length=150, blank=True, help_text="e.g. Touristique Express Yaoundé Mvan")

    class Meta:
        verbose_name = 'Order Delivery Address'
        verbose_name_plural = 'Order Delivery Addresses'

    def __str__(self):
        return f"{self.recipient_name} - {self.neighborhood}, {self.city}"


class OrderStatusHistory(BaseModel):
    """Immutable audit trail for order state changes."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=50)
    comment = models.TextField(blank=True)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name = 'Order Status History'
        verbose_name_plural = 'Order Status Histories'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order.order_number} -> {self.status} at {self.created_at}"

