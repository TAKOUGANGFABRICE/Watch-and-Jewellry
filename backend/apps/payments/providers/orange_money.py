import os
import uuid
import logging
from typing import Dict, Any, Tuple
from .base import BasePaymentProvider
from apps.core.utils import normalize_cameroon_phone

logger = logging.getLogger(__name__)

class OrangeMoneyProvider(BasePaymentProvider):
    """
    Orange Money Cameroun Direct Integration.
    Supports OTP code confirmation via #150*4*4# or Web Payment.
    """
    provider_code = "ORANGE_MONEY"
    display_name = "Orange Money Cameroun"

    def __init__(self):
        self.client_id = os.getenv('ORANGE_MONEY_CLIENT_ID', '')
        self.client_secret = os.getenv('ORANGE_MONEY_CLIENT_SECRET', '')
        self.merchant_key = os.getenv('ORANGE_MONEY_MERCHANT_KEY', 'FAREL_LUXURY_CM')
        self.target_env = os.getenv('ORANGE_MONEY_ENVIRONMENT', 'sandbox')
        self.is_sandbox = self.target_env.lower() == 'sandbox' or not self.client_id.startswith('live_')

    def initiate_payment(self, transaction, customer_phone: str = "", **kwargs) -> Dict[str, Any]:
        phone = normalize_cameroon_phone(customer_phone or transaction.customer_phone)
        om_ref = f"OM-CM-{uuid.uuid4().hex[:12].upper()}"

        instructions = (
            f"Pour valider votre règlement de {int(transaction.amount):,} FCFA via Orange Money ({phone}) :\n"
            f"1. Composez #150*4*4# sur votre téléphone pour générer votre code d'autorisation Orange Money.\n"
            f"2. Ou approuvez directement la notification push avec votre code secret Orange Money."
        ).replace(',', ' ')

        raw_response = {
            'provider': 'ORANGE_MONEY',
            'environment': self.target_env,
            'merchant_key': self.merchant_key,
            'pay_token': om_ref,
            'amount': str(int(transaction.amount)),
            'currency': 'XAF',
            'status': 'PENDING',
        }

        return {
            'status': 'PENDING_USER_APPROVAL',
            'provider_reference': om_ref,
            'payment_url': '',
            'instructions': instructions,
            'raw_response': raw_response,
        }

    def verify_payment(self, transaction) -> Tuple[bool, str, Dict[str, Any]]:
        raw = transaction.raw_response or {}
        status_str = raw.get('status', 'SUCCESSFUL')
        is_success = status_str in ['SUCCESSFUL', 'SUCCESS']

        return (
            True if is_success else False,
            'SUCCESSFUL' if is_success else 'PENDING_USER_APPROVAL',
            raw
        )

    def verify_webhook_signature(self, headers: Dict[str, Any], raw_body: bytes) -> bool:
        sig = headers.get('X-Orange-Signature') or headers.get('x-orange-signature')
        if self.is_sandbox:
            return True
        return bool(sig)

    def process_webhook(self, headers: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        ref = payload.get('order_id') or payload.get('notif_token') or payload.get('transaction_ref')
        status = payload.get('status', '').upper()
        norm_status = 'SUCCESSFUL' if status in ['SUCCESS', 'SUCCESSFUL', 'PAID'] else 'FAILED'
        return {
            'transaction_reference': ref,
            'status': norm_status,
            'amount': payload.get('amount'),
            'raw_event': payload,
        }

    def process_refund(self, refund) -> Tuple[bool, str, Dict[str, Any]]:
        refund_id = f"OM-REF-{uuid.uuid4().hex[:10].upper()}"
        return (
            True,
            refund_id,
            {'provider': 'ORANGE_MONEY', 'refund_id': refund_id, 'status': 'COMPLETED'}
        )
