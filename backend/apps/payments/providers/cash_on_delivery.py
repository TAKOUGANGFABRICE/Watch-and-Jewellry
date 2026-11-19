import uuid
from typing import Dict, Any, Tuple
from .base import BasePaymentProvider

class CashOnDeliveryProvider(BasePaymentProvider):
    """
    Cash on Delivery (COD) / Boutique Showroom Payment.
    Permitted for Douala, Yaoundé, and In-Store Showroom Pickups.
    Payment is settled physically with FARÉL courier upon parcel inspection.
    """
    provider_code = "CASH_ON_DELIVERY"
    display_name = "Paiement à la Livraison ou en Boutique"

    def initiate_payment(self, transaction, customer_phone: str = "", **kwargs) -> Dict[str, Any]:
        cod_ref = f"COD-CM-{uuid.uuid4().hex[:10].upper()}"

        instructions = (
            f"Paiement en espèces ou par Mobile Money lors de la livraison sécurisée à domicile. "
            f"Veuillez préparer la somme exacte de {int(transaction.amount):,} FCFA pour le coursier FARÉL. "
            f"Un reçu physique avec sceau d'authenticité vous sera remis en mains propres."
        ).replace(',', ' ')

        raw_response = {
            'provider': 'CASH_ON_DELIVERY',
            'cod_reference': cod_ref,
            'amount': float(transaction.amount),
            'currency': 'XAF',
            'status': 'PENDING_DELIVERY',
        }

        return {
            'status': 'PENDING_USER_APPROVAL',
            'provider_reference': cod_ref,
            'payment_url': '',
            'instructions': instructions,
            'raw_response': raw_response,
        }

    def verify_payment(self, transaction) -> Tuple[bool, str, Dict[str, Any]]:
        # COD is verified upon physical courier confirmation or store manager scan
        raw = transaction.raw_response or {}
        status_str = raw.get('status', 'PENDING_DELIVERY')
        is_success = status_str in ['DELIVERED_AND_COLLECTED', 'SUCCESSFUL']

        return (
            True if is_success else False,
            'SUCCESSFUL' if is_success else 'PENDING_USER_APPROVAL',
            raw
        )

    def verify_webhook_signature(self, headers: Dict[str, Any], raw_body: bytes) -> bool:
        return True

    def process_webhook(self, headers: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'transaction_reference': payload.get('transaction_ref'),
            'status': 'SUCCESSFUL',
            'amount': payload.get('amount'),
            'raw_event': payload,
        }

    def process_refund(self, refund) -> Tuple[bool, str, Dict[str, Any]]:
        refund_id = f"COD-REF-{uuid.uuid4().hex[:8].upper()}"
        return (
            True,
            refund_id,
            {'provider': 'CASH_ON_DELIVERY', 'refund_id': refund_id, 'status': 'COMPLETED'}
        )
