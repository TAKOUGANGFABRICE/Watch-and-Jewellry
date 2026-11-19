from rest_framework import serializers
from .models import PaymentTransaction, Refund, PaymentWebhookLog
from apps.orders.models import Order
from apps.core.utils import normalize_cameroon_phone, is_valid_cameroon_phone


class PaymentMethodSerializer(serializers.Serializer):
    code = serializers.CharField()
    name = serializers.CharField()
    tagline = serializers.CharField()
    icon = serializers.CharField()
    is_local = serializers.BooleanField()


class InitiatePaymentSerializer(serializers.Serializer):
    order_number = serializers.CharField(required=True)
    payment_method = serializers.ChoiceField(
        choices=[
            ('MTN_MOMO', 'MTN Mobile Money'),
            ('ORANGE_MONEY', 'Orange Money'),
            ('CARD_STRIPE', 'Carte Bancaire'),
            ('CASH_ON_DELIVERY', 'Paiement à la Livraison'),
            ('BANK_TRANSFER', 'Virement Bancaire'),
            ('NOTCH_PAY', 'Notch Pay Unified'),
        ]
    )
    customer_phone = serializers.CharField(required=False, allow_blank=True)
    idempotency_key = serializers.CharField(required=False, max_length=128, allow_blank=True)

    def validate_customer_phone(self, value):
        if not value:
            return ""
        norm = normalize_cameroon_phone(value)
        return norm


class PaymentTransactionSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)

    class Meta:
        model = PaymentTransaction
        fields = [
            'id',
            'transaction_reference',
            'order_number',
            'provider',
            'payment_method',
            'provider_reference',
            'amount',
            'currency',
            'status',
            'customer_phone',
            'payment_url',
            'created_at',
        ]
        read_only_fields = ['id', 'transaction_reference', 'amount', 'currency', 'status', 'created_at']


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = [
            'id',
            'refund_reference',
            'order',
            'payment_transaction',
            'amount',
            'currency',
            'reason',
            'status',
            'created_at',
        ]
        read_only_fields = ['id', 'refund_reference', 'created_at']
