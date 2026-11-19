from django.db import models
from apps.core.models import BaseModel
from apps.core.utils import generate_transaction_ref, normalize_cameroon_phone
from apps.orders.models import Order
from apps.accounts.models import User

class PaymentTransaction(BaseModel):
    """Payment record linked to an order."""
    PROVIDER_CHOICES = (
        ('MTN_MOMO', 'MTN Mobile Money Direct'),
        ('ORANGE_MONEY', 'Orange Money Direct'),
        ('CARD_STRIPE', 'Carte Bancaire (Visa / Mastercard)'),
        ('BANK_TRANSFER', 'Virement Bancaire'),
        ('CASH_ON_DELIVERY', 'Paiement à la Livraison / Boutique'),
        ('NOTCH_PAY', 'Notch Pay (MoMo / OM / Visa / Mastercard)'),
    )

    STATUS_CHOICES = (
        ('INITIATED', 'Initiated'),
        ('PENDING_USER_APPROVAL', 'Awaiting USSD PIN Approval on Phone'),
        ('SUCCESSFUL', 'Payment Confirmed & Settled'),
        ('FAILED', 'Payment Failed or Rejected'),
        ('EXPIRED', 'Payment Request Expired'),
        ('REFUNDED', 'Payment Refunded'),
    )

    order = models.ForeignKey(Order, on_delete=models.RESTRICT, related_name='payments')
    transaction_reference = models.CharField(
        max_length=100,
        unique=True,
        default=generate_transaction_ref,
        db_index=True
    )
    idempotency_key = models.CharField(max_length=128, unique=True, null=True, blank=True, db_index=True)
    provider = models.CharField(max_length=30, choices=PROVIDER_CHOICES, default='NOTCH_PAY')
    payment_method = models.CharField(max_length=50, blank=True)
    provider_reference = models.CharField(max_length=255, blank=True, db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Amount in FCFA")
    currency = models.CharField(max_length=5, default='XAF')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='INITIATED', db_index=True)
    customer_phone = models.CharField(max_length=30, blank=True)
    payment_url = models.URLField(max_length=500, blank=True)
    raw_response = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = 'Payment Transaction'
        verbose_name_plural = 'Payment Transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transaction_reference} | {self.provider} — {self.amount} FCFA ({self.status})"

    def save(self, *args, **kwargs):
        if self.customer_phone:
            self.customer_phone = normalize_cameroon_phone(self.customer_phone)
        super().save(*args, **kwargs)


class Refund(BaseModel):
    """Refund record for processed payments."""
    STATUS_CHOICES = (
        ('PENDING', 'Pending Processing'),
        ('COMPLETED', 'Refund Completed'),
        ('FAILED', 'Refund Failed'),
    )

    order = models.ForeignKey(Order, on_delete=models.RESTRICT, related_name='refunds')
    payment_transaction = models.ForeignKey(PaymentTransaction, on_delete=models.RESTRICT, related_name='refunds')
    refund_reference = models.CharField(max_length=100, unique=True, db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Refund amount in FCFA")
    currency = models.CharField(max_length=5, default='XAF')
    reason = models.TextField(help_text="Reason for refund")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_refunds')
    provider_refund_id = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Refund Record'
        verbose_name_plural = 'Refund Records'
        ordering = ['-created_at']

    def __str__(self):
        return f"Refund {self.refund_reference} — {self.amount} FCFA ({self.status})"


class PaymentWebhookLog(BaseModel):
    """Immutable audit trail for incoming payment webhooks."""
    provider = models.CharField(max_length=50)
    event_type = models.CharField(max_length=100, blank=True)
    payload = models.JSONField(default=dict)
    headers = models.JSONField(default=dict)
    is_verified = models.BooleanField(default=False)
    processed = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Payment Webhook Log'
        verbose_name_plural = 'Payment Webhook Logs'
        ordering = ['-created_at']

    def __str__(self):
        status = "Verified" if self.is_verified else "Unverified"
        return f"{self.provider} Webhook @ {self.created_at} [{status}]"


