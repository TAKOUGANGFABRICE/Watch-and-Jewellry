from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User
from apps.catalog.models import Department, Category, Product, ProductVariant
from apps.inventory.models import StockRecord
from apps.orders.models import Order, OrderItem, OrderAddress
from apps.payments.models import PaymentTransaction, PaymentWebhookLog


class PaymentWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dept = Department.objects.create(name="Jewellery", slug="jewellery")
        self.category = Category.objects.create(department=self.dept, name="Joaillerie", slug="joaillerie")
        self.product = Product.objects.create(
            category=self.category,
            department_type="JEWELLERY",
            brand="FARÉL Privilège",
            name="Bague Diamant Éternité",
            slug="bague-diamant-eternite",
            base_price=Decimal('250000'),
            is_active=True,
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            title="Or Blanc 18K / Taille 54",
            sku="FRL-BG-DIA-54",
            price_override=Decimal('250000'),
            is_default=True,
        )
        self.stock = StockRecord.objects.create(
            variant=self.variant,
            quantity_available=3,
            quantity_reserved=1,
        )

        self.order = Order.objects.create(
            customer_name="Chantal Biya",
            customer_phone="+237699223344",
            subtotal=Decimal('250000'),
            shipping_fee=Decimal('0'),
            total_amount=Decimal('250000'),
            order_status='AWAITING_PAYMENT',
            payment_status='PENDING',
        )
        OrderItem.objects.create(
            order=self.order,
            variant=self.variant,
            product_name="Bague Diamant Éternité",
            variant_title="Or Blanc 18K",
            sku="FRL-BG-DIA-54",
            unit_price=Decimal('250000'),
            quantity=1,
            total_price=Decimal('250000'),
        )

    def test_payment_methods_listing(self):
        response = self.client.get('/api/v1/payments/methods/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        codes = [item['code'] for item in response.data]
        self.assertIn('MTN_MOMO', codes)
        self.assertIn('ORANGE_MONEY', codes)
        self.assertIn('CARD_STRIPE', codes)
        self.assertIn('CASH_ON_DELIVERY', codes)
        self.assertIn('BANK_TRANSFER', codes)

    def test_payment_initiation_mtn_momo(self):
        payload = {
            'order_number': self.order.order_number,
            'payment_method': 'MTN_MOMO',
            'customer_phone': '+237677112233',
            'idempotency_key': 'test_momo_unique_001',
        }
        response = self.client.post('/api/v1/payments/initiate/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.data
        self.assertIn('transaction', data)
        self.assertEqual(data['transaction']['provider'], 'MTN_MOMO')
        self.assertIn('instructions', data)
        self.assertIn('*126#', data['instructions'])

        # Verify transaction in database
        tx = PaymentTransaction.objects.get(transaction_reference=data['transaction']['transaction_reference'])
        self.assertEqual(tx.amount, Decimal('250000'))
        self.assertEqual(tx.status, 'PENDING_USER_APPROVAL')

    def test_payment_idempotency_prevents_duplicates(self):
        payload = {
            'order_number': self.order.order_number,
            'payment_method': 'ORANGE_MONEY',
            'customer_phone': '+237699112233',
            'idempotency_key': 'idem_key_orange_456',
        }
        # First call: creates transaction
        res1 = self.client.post('/api/v1/payments/initiate/', payload, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        tx_ref_1 = res1.data['transaction']['transaction_reference']

        # Second call with identical key: returns existing transaction without re-creating
        res2 = self.client.post('/api/v1/payments/initiate/', payload, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertTrue(res2.data.get('is_idempotent_replay'))
        tx_ref_2 = res2.data['transaction']['transaction_reference']

        self.assertEqual(tx_ref_1, tx_ref_2)
        self.assertEqual(PaymentTransaction.objects.filter(idempotency_key='idem_key_orange_456').count(), 1)

    def test_server_side_payment_verification_and_inventory_fulfillment(self):
        # Create transaction
        tx = PaymentTransaction.objects.create(
            order=self.order,
            provider='MTN_MOMO',
            payment_method='MTN_MOMO',
            amount=self.order.total_amount,
            status='PENDING_USER_APPROVAL',
            raw_response={'status': 'SUCCESSFUL'},
        )

        # Trigger server-side verification
        res = self.client.post(f'/api/v1/payments/verify/{tx.transaction_reference}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['verified'])
        self.assertEqual(res.data['status'], 'SUCCESSFUL')

        # Check order status updated
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'PAID')
        self.assertEqual(self.order.order_status, 'PAID')

        # Check inventory was permanently fulfilled: reserved dropped from 1 to 0
        self.stock.refresh_from_db()
        self.assertEqual(self.stock.quantity_reserved, 0)

    def test_payment_webhook_processing_and_audit_log(self):
        tx = PaymentTransaction.objects.create(
            order=self.order,
            provider='NOTCH_PAY',
            provider_reference='np_ch_test_777',
            amount=self.order.total_amount,
            status='INITIATED',
        )

        webhook_payload = {
            'event': 'payment.complete',
            'data': {
                'reference': tx.transaction_reference,
                'amount': 250000,
            }
        }

        response = self.client.post(
            '/api/v1/payments/webhook/NOTCH_PAY/',
            webhook_payload,
            format='json',
            HTTP_X_NOTCH_SIGNATURE='valid_dev_sig',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check webhook audit log created
        log = PaymentWebhookLog.objects.filter(provider='NOTCH_PAY').latest('created_at')
        self.assertTrue(log.is_verified)
        self.assertTrue(log.processed)

        # Check transaction and order settled
        tx.refresh_from_db()
        self.assertEqual(tx.status, 'SUCCESSFUL')
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'PAID')
