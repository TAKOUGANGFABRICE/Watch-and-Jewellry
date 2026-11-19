import uuid
from typing import Dict, Any, Tuple
from .base import BasePaymentProvider

class BankTransferProvider(BasePaymentProvider):
    """
    Bank Wire Transfer Provider for high-ticket luxury orders.
    Provides Cameroon corporate bank accounts (Afriland First Bank / BICEC / SG Cameroun).
    """
    provider_code = "BANK_TRANSFER"
    display_name = "Virement Bancaire Commercial"

    def initiate_payment(self, transaction, customer_phone: str = "", **kwargs) -> Dict[str, Any]:
        wire_ref = f"WIRE-CM-{uuid.uuid4().hex[:8].upper()}"

        instructions = (
            f"Veuillez effectuer votre virement de {int(transaction.amount):,} FCFA vers le compte commercial FARÉL :\n"
            f"• Banque : Afriland First Bank Cameroun\n"
            f"• Titulaire : MAISON FARÉL SARL\n"
            f"• RIB : 10005 00001 01234567890 45\n"
            f"• Motif obligatoire : {transaction.order.order_number}\n"
            f"Votre commande sera expédiée dès confirmation de réception par notre service comptabilité."
        ).replace(',', ' ')

        raw_response = {
            'provider': 'BANK_TRANSFER',
            'wire_reference': wire_ref,
            'amount': float(transaction.amount),
            'currency': 'XAF',
            'bank_name': 'Afriland First Bank Cameroun',
            'status': 'PENDING_BANK_CLEARANCE',
        }

        return {
            'status': 'PENDING_USER_APPROVAL',
            'provider_reference': wire_ref,
            'payment_url': '',
            'instructions': instructions,
            'raw_response': raw_response,
        }

    def verify_payment(self, transaction) -> Tuple[bool, str, Dict[str, Any]]:
        raw = transaction.raw_response or {}
        status_str = raw.get('status', 'PENDING_BANK_CLEARANCE')
        is_success = status_str in ['CLEARED', 'SUCCESSFUL']

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
        refund_id = f"WIRE-REF-{uuid.uuid4().hex[:8].upper()}"
        return (
            True,
            refund_id,
            {'provider': 'BANK_TRANSFER', 'refund_id': refund_id, 'status': 'COMPLETED'}
        )
