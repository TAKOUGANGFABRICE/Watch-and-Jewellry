from django.contrib import admin
from .models import PaymentTransaction, PaymentWebhookLog, Refund

@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_reference', 'order', 'provider', 'payment_method', 'amount', 'currency', 'status', 'customer_phone', 'created_at')
    list_filter = ('provider', 'status', 'created_at')
    search_fields = ('transaction_reference', 'provider_reference', 'idempotency_key', 'customer_phone', 'order__order_number')
    readonly_fields = ('transaction_reference', 'order', 'amount', 'currency', 'created_at')

@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ('refund_reference', 'order', 'payment_transaction', 'amount', 'status', 'processed_by', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('refund_reference', 'order__order_number', 'provider_refund_id')
    readonly_fields = ('refund_reference', 'order', 'payment_transaction', 'amount', 'created_at')

@admin.register(PaymentWebhookLog)
class PaymentWebhookLogAdmin(admin.ModelAdmin):
    list_display = ('provider', 'event_type', 'is_verified', 'processed', 'created_at')
    list_filter = ('provider', 'is_verified', 'processed', 'created_at')
    search_fields = ('provider', 'event_type')
    readonly_fields = ('provider', 'event_type', 'payload', 'headers', 'created_at')


