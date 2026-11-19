from rest_framework import serializers
from .models import Order, OrderItem, OrderAddress, OrderStatusHistory
from apps.catalog.models import ProductVariant
from apps.core.utils import normalize_cameroon_phone, is_valid_cameroon_phone


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product_name',
            'variant_title',
            'sku',
            'unit_price',
            'quantity',
            'total_price',
        ]


class OrderAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderAddress
        fields = [
            'recipient_name',
            'primary_phone',
            'backup_phone',
            'region',
            'city',
            'neighborhood',
            'landmark',
            'additional_instructions',
            'agency_name',
        ]


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = ['status', 'comment', 'created_at']


class OrderListSerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'order_number',
            'created_at',
            'total_amount',
            'currency',
            'order_status',
            'payment_status',
            'fulfillment_status',
            'delivery_method',
            'items_count',
        ]

    def get_items_count(self, obj) -> int:
        return obj.items.count()


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = OrderAddressSerializer(read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'order_number',
            'created_at',
            'customer_name',
            'customer_email',
            'customer_phone',
            'subtotal',
            'discount_amount',
            'shipping_fee',
            'total_amount',
            'currency',
            'order_status',
            'payment_status',
            'fulfillment_status',
            'delivery_method',
            'customer_notes',
            'items',
            'shipping_address',
            'status_history',
        ]


class CheckoutItemSerializer(serializers.Serializer):
    variant_id = serializers.UUIDField(required=True)
    quantity = serializers.IntegerField(min_value=1, default=1)


class CheckoutAddressInputSerializer(serializers.Serializer):
    recipient_name = serializers.CharField(max_length=150)
    primary_phone = serializers.CharField(max_length=30)
    backup_phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    region = serializers.CharField(max_length=100, default='Littoral')
    city = serializers.CharField(max_length=100)
    neighborhood = serializers.CharField(max_length=150)
    landmark = serializers.CharField(required=False, allow_blank=True)
    additional_instructions = serializers.CharField(required=False, allow_blank=True)
    agency_name = serializers.CharField(required=False, allow_blank=True)

    def validate_primary_phone(self, value):
        norm = normalize_cameroon_phone(value)
        if not is_valid_cameroon_phone(norm):
            raise serializers.ValidationError("Le numéro de téléphone du destinataire doit être un numéro camerounais valide (+237 6XXXXXXXX).")
        return norm


class CheckoutCreateSerializer(serializers.Serializer):
    """Payload for multi-step luxury checkout."""
    customer_name = serializers.CharField(max_length=150)
    customer_phone = serializers.CharField(max_length=30)
    customer_email = serializers.EmailField(required=False, allow_blank=True)
    delivery_method = serializers.ChoiceField(
        choices=[
            ('DOORSTEP_EXPRESS', 'Doorstep Express Delivery'),
            ('AGENCY_PICKUP', 'Agency Pickup'),
            ('SHOWROOM_COLLECTION', 'Showroom Boutique Collection'),
        ],
        default='DOORSTEP_EXPRESS'
    )
    shipping_address = CheckoutAddressInputSerializer(required=True)
    items = CheckoutItemSerializer(many=True, required=True)
    customer_notes = serializers.CharField(required=False, allow_blank=True)

    def validate_customer_phone(self, value):
        norm = normalize_cameroon_phone(value)
        if not is_valid_cameroon_phone(norm):
            raise serializers.ValidationError("Le numéro de contact doit être un numéro camerounais valide (+237 6XXXXXXXX).")
        return norm

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Votre panier d'achat est vide.")
        return value


class OrderTrackingSerializer(serializers.ModelSerializer):
    """Public customer order tracking view."""
    items_summary = serializers.SerializerMethodField()
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    shipping_city = serializers.CharField(source='shipping_address.city', read_only=True)
    shipping_neighborhood = serializers.CharField(source='shipping_address.neighborhood', read_only=True)

    class Meta:
        model = Order
        fields = [
            'order_number',
            'created_at',
            'order_status',
            'payment_status',
            'fulfillment_status',
            'delivery_method',
            'shipping_city',
            'shipping_neighborhood',
            'total_amount',
            'currency',
            'items_summary',
            'status_history',
        ]

    def get_items_summary(self, obj):
        return [
            {
                'product_name': item.product_name,
                'variant_title': item.variant_title,
                'quantity': item.quantity,
                'total_price': item.total_price,
            }
            for item in obj.items.all()
        ]
