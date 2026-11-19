from decimal import Decimal
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, views, viewsets
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Order, OrderItem, OrderAddress, OrderStatusHistory
from .serializers import (
    CheckoutCreateSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    OrderTrackingSerializer,
)
from apps.catalog.models import ProductVariant
from apps.inventory.models import StockRecord
from apps.shipping.models import City, ShippingRate


def calculate_shipping_fee(city_name: str, delivery_method: str, subtotal: Decimal) -> Decimal:
    """Computes delivery fee according to Cameroon geography and free shipping threshold."""
    if delivery_method == 'SHOWROOM_COLLECTION':
        return Decimal('0')

    # Free delivery threshold for luxury orders >= 150 000 FCFA
    if subtotal >= Decimal('150000'):
        return Decimal('0')

    city_clean = city_name.strip().lower()
    if 'douala' in city_clean:
        return Decimal('1500') if delivery_method == 'AGENCY_PICKUP' else Decimal('2000')
    elif 'yaound' in city_clean:
        return Decimal('2000') if delivery_method == 'AGENCY_PICKUP' else Decimal('3000')
    else:
        return Decimal('2500') if delivery_method == 'AGENCY_PICKUP' else Decimal('3500')


class CheckoutCreateView(views.APIView):
    """
    Step 1 to Step 4 Checkout submission.
    Creates order record, creates address, and atomically reserves inventory.
    Guarantees consistency via database transactions.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CheckoutCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        items_data = data['items']
        address_data = data['shipping_address']
        delivery_method = data.get('delivery_method', 'DOORSTEP_EXPRESS')

        # 1. Check stock availability for all items first
        variant_ids = [item['variant_id'] for item in items_data]
        variants = ProductVariant.objects.filter(id__in=variant_ids).select_related('product')
        variant_map = {v.id: v for v in variants}

        for item in items_data:
            vid = item['variant_id']
            qty = item['quantity']
            variant = variant_map.get(vid)

            if not variant:
                return Response(
                    {'error': f"L'article sélectionné (ID: {vid}) n'est plus disponible au catalogue."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            stock_record = getattr(variant, 'stock_record', None)
            if not stock_record or stock_record.quantity_available < qty:
                avail = stock_record.quantity_available if stock_record else 0
                return Response(
                    {
                        'error': f"Stock insuffisant pour '{variant.product.name} ({variant.title})'. "
                                 f"Quantité demandée: {qty}, Disponible: {avail}."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # 2. Perform Atomic Order Creation & Inventory Reservation
        with transaction.atomic():
            subtotal = Decimal('0')
            order_items_to_create = []

            for item in items_data:
                variant = variant_map[item['variant_id']]
                qty = item['quantity']
                unit_price = variant.price
                line_total = unit_price * qty
                subtotal += line_total

                order_items_to_create.append({
                    'variant': variant,
                    'product_name': variant.product.name,
                    'variant_title': variant.title,
                    'sku': variant.sku,
                    'unit_price': unit_price,
                    'quantity': qty,
                    'total_price': line_total,
                })

            shipping_fee = calculate_shipping_fee(
                city_name=address_data.get('city', 'Douala'),
                delivery_method=delivery_method,
                subtotal=subtotal,
            )
            discount_amount = Decimal('0')
            total_amount = subtotal + shipping_fee - discount_amount

            user = request.user if request.user and request.user.is_authenticated else None

            # Create Order
            order = Order.objects.create(
                user=user,
                customer_name=data['customer_name'],
                customer_phone=data['customer_phone'],
                customer_email=data.get('customer_email', ''),
                subtotal=subtotal,
                discount_amount=discount_amount,
                shipping_fee=shipping_fee,
                total_amount=total_amount,
                currency='XAF',
                order_status='AWAITING_PAYMENT',
                payment_status='PENDING',
                fulfillment_status='UNFULFILLED',
                delivery_method=delivery_method,
                customer_notes=data.get('customer_notes', ''),
            )

            # Create Order Items
            for o_item in order_items_to_create:
                OrderItem.objects.create(
                    order=order,
                    variant=o_item['variant'],
                    product_name=o_item['product_name'],
                    variant_title=o_item['variant_title'],
                    sku=o_item['sku'],
                    unit_price=o_item['unit_price'],
                    quantity=o_item['quantity'],
                    total_price=o_item['total_price'],
                )

                # Reserve stock atomically
                variant = o_item['variant']
                if hasattr(variant, 'stock_record'):
                    variant.stock_record.reserve(
                        qty=o_item['quantity'],
                        reason=f"Réservation pour commande {order.order_number}",
                        actor=user,
                    )

            # Create Snapshot Address
            OrderAddress.objects.create(
                order=order,
                recipient_name=address_data['recipient_name'],
                primary_phone=address_data['primary_phone'],
                backup_phone=address_data.get('backup_phone', ''),
                region=address_data.get('region', 'Littoral'),
                city=address_data['city'],
                neighborhood=address_data['neighborhood'],
                landmark=address_data.get('landmark', ''),
                additional_instructions=address_data.get('additional_instructions', ''),
                agency_name=address_data.get('agency_name', ''),
            )

            # Audit History
            OrderStatusHistory.objects.create(
                order=order,
                status='AWAITING_PAYMENT',
                comment="Commande créée par le client. En attente de validation du paiement.",
                changed_by=user,
            )

        return Response(
            {
                'message': "Commande créée avec succès.",
                'order': OrderDetailSerializer(order).data,
            },
            status=status.HTTP_201_CREATED,
        )


class OrderTrackingView(views.APIView):
    """
    Public lookup for customers tracking their order progress.
    """
    permission_classes = [AllowAny]

    def get(self, request, order_number):
        order = get_object_or_404(
            Order.objects.prefetch_related('items', 'status_history').select_related('shipping_address'),
            order_number=order_number,
        )
        return Response(OrderTrackingSerializer(order).data, status=status.HTTP_200_OK)


class MyOrdersViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Customer portal view for orders placed by the authenticated user.
    Strictly isolated: users can never view orders belonging to other accounts.
    """
    permission_classes = [IsAuthenticated]
    lookup_field = 'order_number'

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related('items', 'status_history')
            .select_related('shipping_address')
            .order_by('-created_at')
        )

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OrderDetailSerializer
        return OrderListSerializer
