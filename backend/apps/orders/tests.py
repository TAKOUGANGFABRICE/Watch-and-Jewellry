from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User
from apps.catalog.models import Department, Category, Product, ProductVariant
from apps.inventory.models import StockRecord
from apps.orders.models import Order, OrderItem, OrderAddress


class OrderCheckoutTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dept = Department.objects.create(name="Watches", slug="watches")
        self.category = Category.objects.create(department=self.dept, name="Montres Homme", slug="montres-homme")
        self.product = Product.objects.create(
            category=self.category,
            department_type="WATCH",
            brand="FARÉL Chrono",
            name="FARÉL Royal Chronograph 41mm",
            slug="farel-royal-chrono",
            base_price=Decimal('185000'),
            is_active=True,
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            title="Or Champagne / Cuir Noir",
            sku="FRL-RC-41-GLD",
            price_override=Decimal('185000'),
            is_default=True,
        )
        self.stock = StockRecord.objects.create(
            variant=self.variant,
            quantity_available=5,
            quantity_reserved=0,
        )

        self.user = User.objects.create_user(
            email="client.luxe@farel.cm",
            phone="+237690112233",
            password="StrongPassword2026!",
            first_name="Jean",
            last_name="Kemajou",
        )

    def test_checkout_order_creation_success(self):
        payload = {
            'customer_name': "Jean Kemajou",
            'customer_phone': "+237 690 11 22 33",
            'customer_email': "client.luxe@farel.cm",
            'delivery_method': 'DOORSTEP_EXPRESS',
            'shipping_address': {
                'recipient_name': "Jean Kemajou",
                'primary_phone': "+237 690 11 22 33",
                'city': "Douala",
                'neighborhood': "Bonapriso",
                'landmark': "Rue Tokoto, Immeuble Horizon",
                'additional_instructions': "Appeler à l'arrivée",
            },
            'items': [
                {
                    'variant_id': str(self.variant.id),
                    'quantity': 2,
                }
            ],
            'customer_notes': "Livraison VIP avec emballage cadeau FARÉL.",
        }

        response = self.client.post('/api/v1/orders/checkout/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.data['order']
        self.assertEqual(data['customer_name'], "Jean Kemajou")
        self.assertEqual(data['payment_status'], "PENDING")
        self.assertEqual(data['order_status'], "AWAITING_PAYMENT")

        # Subtotal: 185000 * 2 = 370 000 FCFA. Since subtotal >= 150 000, shipping fee is 0 FCFA!
        self.assertEqual(Decimal(str(data['subtotal'])), Decimal('370000'))
        self.assertEqual(Decimal(str(data['shipping_fee'])), Decimal('0'))
        self.assertEqual(Decimal(str(data['total_amount'])), Decimal('370000'))

        # Verify stock reservation
        self.stock.refresh_from_db()
        self.assertEqual(self.stock.quantity_available, 3)
        self.assertEqual(self.stock.quantity_reserved, 2)

    def test_checkout_insufficient_stock_atomic_rollback(self):
        # Stock only has 5, request 10 units
        payload = {
            'customer_name': "Client Exigeant",
            'customer_phone': "+237 677 88 99 00",
            'delivery_method': 'DOORSTEP_EXPRESS',
            'shipping_address': {
                'recipient_name': "Client Exigeant",
                'primary_phone': "+237 677 88 99 00",
                'city': "Yaoundé",
                'neighborhood': "Bastos",
            },
            'items': [
                {
                    'variant_id': str(self.variant.id),
                    'quantity': 10,
                }
            ],
        }

        response = self.client.post('/api/v1/orders/checkout/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Stock insuffisant', response.data['error'])

        # Verify stock was untouched
        self.stock.refresh_from_db()
        self.assertEqual(self.stock.quantity_available, 5)
        self.assertEqual(self.stock.quantity_reserved, 0)
        # Verify no order record exists
        self.assertEqual(Order.objects.count(), 0)

    def test_order_tracking_public(self):
        order = Order.objects.create(
            customer_name="Paul Biya",
            customer_phone="+237699112233",
            subtotal=Decimal('185000'),
            shipping_fee=Decimal('2000'),
            total_amount=Decimal('187000'),
            order_status='SHIPPED',
            payment_status='PAID',
            delivery_method='DOORSTEP_EXPRESS',
        )
        OrderAddress.objects.create(
            order=order,
            recipient_name="Paul Biya",
            primary_phone="+237699112233",
            city="Yaoundé",
            neighborhood="Etoudi",
        )

        response = self.client.get(f'/api/v1/orders/tracking/{order.order_number}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['order_number'], order.order_number)
        self.assertEqual(response.data['order_status'], 'SHIPPED')
        self.assertEqual(response.data['payment_status'], 'PAID')
        self.assertEqual(response.data['shipping_city'], 'Yaoundé')

    def test_customer_order_data_isolation(self):
        user_a = self.user
        user_b = User.objects.create_user(
            email="other.client@farel.cm",
            phone="+237670998877",
            password="StrongPassword2026!",
            first_name="Marc",
            last_name="Fotso",
        )

        order_a = Order.objects.create(
            user=user_a,
            customer_name="Jean Kemajou",
            customer_phone=user_a.phone,
            subtotal=Decimal('100000'),
            total_amount=Decimal('102000'),
        )
        order_b = Order.objects.create(
            user=user_b,
            customer_name="Marc Fotso",
            customer_phone=user_b.phone,
            subtotal=Decimal('200000'),
            total_amount=Decimal('200000'),
        )

        # Authenticate as User A
        self.client.force_authenticate(user=user_a)

        # Listing orders returns only order_a
        response = self.client.get('/api/v1/orders/my-orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order_numbers = [item['order_number'] for item in response.data['results']] if 'results' in response.data else [item['order_number'] for item in response.data]
        self.assertIn(order_a.order_number, order_numbers)
        self.assertNotIn(order_b.order_number, order_numbers)

        # Querying order_b directly returns 404
        detail_response = self.client.get(f'/api/v1/orders/my-orders/{order_b.order_number}/')
        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)
