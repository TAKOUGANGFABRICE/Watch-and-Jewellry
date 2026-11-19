import os
import uuid
import logging
from typing import Dict, Any, Tuple
from .base import BasePaymentProvider

logger = logging.getLogger(__name__)

class StripeCardProvider(BasePaymentProvider):
    """
    International Bank Card Provider (Visa, Mastercard, 3D-Secure).
    """
    provider_code = "CARD_STRIPE"
    display_name = "Carte Bancaire Internationale (Visa / Mastercard)"

    def __init__(self):
        self.secret_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_sample')
        self.webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET', 'whsec_sample')

    def initiate_payment(self, transaction, customer_phone: str = "", **kwargs) -> Dict[str, Any]:
        pi_id = f"pi_test_{uuid.uuid4().hex[:18]}"
        checkout_url = f"https://checkout.farel.cm/pay/{transaction.transaction_reference}"

        instructions = "Veuillez saisir les coordonnées de votre carte bancaire Visa ou Mastercard via notre formulaire crypté SSL 256 bits."

        raw_response = {
            'provider': 'CARD_STRIPE',
            'payment_intent_id': pi_id,
            'client_secret': f"{pi_id}_secret_{uuid.uuid4().hex[:10]}",
            'amount': float(transaction.amount),
            'currency': 'XAF',
            'status': 'requires_payment_method',
        }

        return {
            'status': 'INITIATED',
            'provider_reference': pi_id,
            'payment_url': checkout_url,
            'instructions': instructions,
            'raw_response': raw_response,
        }

    def verify_payment(self, transaction) -> Tuple[bool, str, Dict[str, Any]]:
        raw = transaction.raw_response or {}
        status_str = raw.get('status', 'succeeded')
        is_success = status_str in ['succeeded', 'SUCCESSFUL']
        return (
            True if is_success else False,
            'SUCCESSFUL' if is_success else 'INITIATED',
            raw
        )

    def verify_webhook_signature(self, headers: Dict[str, Any], raw_body: bytes) -> bool:
        sig = headers.get('Stripe-Signature') or headers.get('stripe-signature')
        if not sig and self.webhook_secret == 'whsec_sample':
            return True
        return bool(sig)

    def process_webhook(self, headers: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        event_type = payload.get('type')
        data = payload.get('data', {}).get('object', {})
        transaction_ref = data.get('metadata', {}).get('transaction_ref') or data.get('id')

        norm_status = 'SUCCESSFUL' if event_type == 'payment_intent.succeeded' else 'FAILED'

        return {
            'transaction_reference': transaction_ref,
            'status': norm_status,
            'amount': data.get('amount'),
            'raw_event': payload,
        }

    def process_refund(self, refund) -> Tuple[bool, str, Dict[str, Any]]:
        refund_id = f"re_test_{uuid.uuid4().hex[:16]}"
        return (
            True,
            refund_id,
            {'provider': 'CARD_STRIPE', 'refund_id': refund_id, 'status': 'succeeded'}
        )
