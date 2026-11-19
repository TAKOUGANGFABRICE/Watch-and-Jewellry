import logging
import uuid
from decimal import Decimal
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import PaymentTransaction, Refund, PaymentWebhookLog
from .serializers import (
    InitiatePaymentSerializer,
    PaymentTransactionSerializer,
    RefundSerializer,
)
from .providers.factory import get_payment_provider, list_supported_providers
from apps.orders.models import Order, OrderStatusHistory
from apps.inventory.models import StockRecord

logger = logging.getLogger(__name__)


class PaymentMethodsView(views.APIView):
    """Returns available payment options for FARÉL checkout."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(list_supported_providers(), status=status.HTTP_200_OK)


class InitiatePaymentView(views.APIView):
    """
    Initiates payment for an order with idempotency protection.
    Prevents duplicate transactions if identical idempotency_key is resent.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_number = serializer.validated_data['order_number']
        payment_method = serializer.validated_data['payment_method']
        customer_phone = serializer.validated_data.get('customer_phone', '')
        idempotency_key = serializer.validated_data.get('idempotency_key')

        order = get_object_or_404(Order, order_number=order_number)

        if order.payment_status == 'PAID':
            return Response(
                {
                    'error': "Cette commande a déjà été réglée avec succès.",
                    'order_number': order.order_number,
                    'payment_status': order.payment_status,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Idempotency Check: return existing transaction if already initiated with this key
        if idempotency_key:
            existing = PaymentTransaction.objects.filter(idempotency_key=idempotency_key).first()
            if existing:
                return Response(
                    {
                        'message': "Transaction existante récupérée (clé d'idempotence).",
                        'transaction': PaymentTransactionSerializer(existing).data,
                        'instructions': existing.raw_response.get('instructions', ''),
                        'payment_url': existing.payment_url,
                        'is_idempotent_replay': True,
                    },
                    status=status.HTTP_200_OK,
                )

        phone = customer_phone or order.customer_phone

        # Create PaymentTransaction record inside atomic block
        with transaction.atomic():
            tx = PaymentTransaction.objects.create(
                order=order,
                provider=payment_method,
                payment_method=payment_method,
                amount=order.total_amount,
                currency=order.currency,
                customer_phone=phone,
                idempotency_key=idempotency_key or f"ik_{uuid.uuid4().hex[:16]}",
                status='INITIATED',
            )

            # Delegate to payment provider abstraction
            provider = get_payment_provider(payment_method)
            init_res = provider.initiate_payment(tx, customer_phone=phone)

            tx.status = init_res.get('status', 'PENDING_USER_APPROVAL')
            tx.provider_reference = init_res.get('provider_reference', '')
            tx.payment_url = init_res.get('payment_url', '')
            tx.raw_response = init_res.get('raw_response', {})
            tx.save()

            # Update Order status
            if order.order_status == 'PENDING':
                order.order_status = 'AWAITING_PAYMENT'
                order.save(update_fields=['order_status'])

        return Response(
            {
                'message': "Paiement initié avec succès.",
                'transaction': PaymentTransactionSerializer(tx).data,
                'instructions': init_res.get('instructions', ''),
                'payment_url': tx.payment_url,
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyPaymentView(views.APIView):
    """
    Server-Side Payment Verification.
    Validates payment with gateway and marks order as PAID inside a database transaction.
    CRITICAL: Never relies on frontend claims. Only updates when provider confirms.
    """
    permission_classes = [AllowAny]

    def post(self, request, transaction_ref):
        tx = get_object_or_404(PaymentTransaction, transaction_reference=transaction_ref)
        order = tx.order

        if tx.status == 'SUCCESSFUL' and order.payment_status == 'PAID':
            return Response(
                {
                    'verified': True,
                    'status': 'SUCCESSFUL',
                    'message': "Paiement déjà validé et confirmé.",
                    'order_number': order.order_number,
                    'order_status': order.order_status,
                },
                status=status.HTTP_200_OK,
            )

        provider = get_payment_provider(tx.provider)
        is_success, new_status, raw = provider.verify_payment(tx)

        if is_success:
            with transaction.atomic():
                tx.status = 'SUCCESSFUL'
                tx.raw_response = raw
                tx.save(update_fields=['status', 'raw_response', 'updated_at'])

                order.payment_status = 'PAID'
                order.order_status = 'PAID'
                order.save(update_fields=['payment_status', 'order_status', 'updated_at'])

                # Fulfill reserved inventory permanently
                for item in order.items.all():
                    if item.variant:
                        stock_record = getattr(item.variant, 'stock_record', None)
                        if stock_record:
                            stock_record.fulfill(
                                qty=item.quantity,
                                reason=f"Paiement validé pour commande {order.order_number}"
                            )

                # Record audit history
                OrderStatusHistory.objects.create(
                    order=order,
                    status='PAID',
                    comment=f"Paiement de {order.total_amount} FCFA vérifié et confirmé via {tx.get_provider_display()} (Réf: {tx.transaction_reference})."
                )

            return Response(
                {
                    'verified': True,
                    'status': 'SUCCESSFUL',
                    'message': "Règlement confirmé avec succès. Votre commande FARÉL est en cours de préparation.",
                    'order_number': order.order_number,
                    'order_status': order.order_status,
                    'payment_status': order.payment_status,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                'verified': False,
                'status': new_status,
                'message': "Paiement en attente de confirmation par le client ou l'opérateur.",
                'order_number': order.order_number,
                'order_status': order.order_status,
            },
            status=status.HTTP_200_OK,
        )


class WebhookPaymentView(views.APIView):
    """
    Signed webhook endpoint receiving asynchronous notifications from gateways.
    Validates cryptographic signature, audits event, and updates state atomically.
    """
    permission_classes = [AllowAny]

    def post(self, request, provider_code):
        provider = get_payment_provider(provider_code)
        raw_body = request.body
        headers = dict(request.headers)
        for key, val in request.META.items():
            if key.startswith('HTTP_'):
                header_name = key[5:].replace('_', '-')
                headers[header_name] = val
                headers[key] = val

        # 1. Verify Cryptographic Signature
        is_verified = provider.verify_webhook_signature(headers, raw_body)

        # 2. Audit Trail Log
        try:
            payload = request.data if isinstance(request.data, dict) else {}
        except Exception:
            payload = {}

        log_entry = PaymentWebhookLog.objects.create(
            provider=provider_code,
            event_type=payload.get('event', payload.get('type', 'webhook_event')),
            payload=payload,
            headers=headers,
            is_verified=is_verified,
        )

        if not is_verified:
            log_entry.error_message = "Signature cryptographique du webhook invalide ou suspecte."
            log_entry.save(update_fields=['error_message'])
            return Response({'error': "Signature invalide."}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Process Event
        normalized = provider.process_webhook(headers, payload)
        tx_ref = normalized.get('transaction_reference')
        norm_status = normalized.get('status')

        if not tx_ref:
            log_entry.error_message = "Aucune référence de transaction identifiée."
            log_entry.save(update_fields=['error_message'])
            return Response({'error': "Référence introuvable dans le payload."}, status=status.HTTP_400_BAD_REQUEST)

        tx = PaymentTransaction.objects.filter(
            transaction_reference=tx_ref
        ).first() or PaymentTransaction.objects.filter(provider_reference=tx_ref).first()

        if not tx:
            log_entry.error_message = f"Transaction introuvable pour la référence {tx_ref}."
            log_entry.save(update_fields=['error_message'])
            return Response({'error': "Transaction non trouvée."}, status=status.HTTP_404_NOT_FOUND)

        if norm_status == 'SUCCESSFUL' and tx.status != 'SUCCESSFUL':
            with transaction.atomic():
                tx.status = 'SUCCESSFUL'
                tx.raw_response = payload
                tx.save(update_fields=['status', 'raw_response', 'updated_at'])

                order = tx.order
                order.payment_status = 'PAID'
                order.order_status = 'PAID'
                order.save(update_fields=['payment_status', 'order_status', 'updated_at'])

                for item in order.items.all():
                    if item.variant and hasattr(item.variant, 'stock_record'):
                        item.variant.stock_record.fulfill(
                            qty=item.quantity,
                            reason=f"Webhook confirmé pour commande {order.order_number}"
                        )

                OrderStatusHistory.objects.create(
                    order=order,
                    status='PAID',
                    comment=f"Paiement webhook validé ({provider_code})."
                )

        log_entry.processed = True
        log_entry.save(update_fields=['processed'])

        return Response({'status': 'success', 'message': "Webhook traité."}, status=status.HTTP_200_OK)


class SimulatePaymentSuccessView(views.APIView):
    """
    Dedicated development & staging endpoint to simulate customer entering their USSD PIN
    (e.g. MTN MoMo or Orange Money) and instantly confirm the transaction.
    """
    permission_classes = [AllowAny]

    def post(self, request, transaction_ref):
        tx = get_object_or_404(PaymentTransaction, transaction_reference=transaction_ref)
        order = tx.order

        with transaction.atomic():
            tx.status = 'SUCCESSFUL'
            tx.raw_response = {
                'simulated': True,
                'status': 'SUCCESSFUL',
                'operator_message': 'PIN client validé avec succès sur le terminal.',
            }
            tx.save()

            order.payment_status = 'PAID'
            order.order_status = 'PAID'
            order.save(update_fields=['payment_status', 'order_status', 'updated_at'])

            for item in order.items.all():
                if item.variant and hasattr(item.variant, 'stock_record'):
                    item.variant.stock_record.fulfill(
                        qty=item.quantity,
                        reason=f"Paiement simulé validé pour commande {order.order_number}"
                    )

            OrderStatusHistory.objects.create(
                order=order,
                status='PAID',
                comment=f"Paiement {tx.get_provider_display()} validé avec succès (simulation test)."
            )

        return Response(
            {
                'message': "Simulation de validation USSD réussie.",
                'order_number': order.order_number,
                'payment_status': order.payment_status,
                'order_status': order.order_status,
                'transaction_reference': tx.transaction_reference,
            },
            status=status.HTTP_200_OK,
        )


class RefundCreateView(views.APIView):
    """Creates a refund record and invokes provider refund logic."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RefundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_id = serializer.validated_data['order'].id
        order = get_object_or_404(Order, id=order_id)
        tx = serializer.validated_data['payment_transaction']
        amount = serializer.validated_data['amount']
        reason = serializer.validated_data['reason']

        provider = get_payment_provider(tx.provider)

        with transaction.atomic():
            refund = Refund.objects.create(
                order=order,
                payment_transaction=tx,
                refund_reference=f"REF-{uuid.uuid4().hex[:10].upper()}",
                amount=amount,
                currency=order.currency,
                reason=reason,
                status='PENDING',
                processed_by=request.user,
            )

            is_success, ref_id, raw = provider.process_refund(refund)
            if is_success:
                refund.status = 'COMPLETED'
                refund.provider_refund_id = ref_id
                refund.notes = str(raw)
                refund.save()

                order.order_status = 'REFUNDED'
                order.payment_status = 'REFUNDED'
                order.save(update_fields=['order_status', 'payment_status', 'updated_at'])

                OrderStatusHistory.objects.create(
                    order=order,
                    status='REFUNDED',
                    comment=f"Remboursement de {amount} FCFA effectué. Motif: {reason}",
                    changed_by=request.user,
                )

        return Response(RefundSerializer(refund).data, status=status.HTTP_201_CREATED)
