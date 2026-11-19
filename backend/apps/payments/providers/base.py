from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)

class BasePaymentProvider(ABC):
    """
    Abstract Base Class for all payment providers on FARÉL platform.
    Guarantees consistent payment lifecycle, status tracking, idempotency,
    and webhook handling across all Cameroon and international gateways.
    """

    provider_code: str = "BASE"
    display_name: str = "Base Provider"

    @abstractmethod
    def initiate_payment(self, transaction, customer_phone: str = "", **kwargs) -> Dict[str, Any]:
        """
        Initiate payment request with gateway.
        Returns dictionary with:
        - status: 'INITIATED', 'PENDING_USER_APPROVAL', 'SUCCESSFUL', 'FAILED'
        - provider_reference: str
        - payment_url: Optional[str]
        - instructions: Optional[str] (e.g. USSD prompt directions)
        - raw_response: Dict
        """
        pass

    @abstractmethod
    def verify_payment(self, transaction) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Server-side payment verification.
        Returns:
        - is_successful: bool
        - status: str (e.g. 'SUCCESSFUL', 'FAILED', 'PENDING_USER_APPROVAL')
        - raw_response: Dict
        """
        pass

    @abstractmethod
    def verify_webhook_signature(self, headers: Dict[str, Any], raw_body: bytes) -> bool:
        """
        Verifies cryptographic authenticity of inbound webhook.
        """
        pass

    @abstractmethod
    def process_webhook(self, headers: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes inbound webhook and returns normalized event:
        - transaction_reference: str
        - status: 'SUCCESSFUL' | 'FAILED'
        - amount: Optional[Decimal]
        """
        pass

    @abstractmethod
    def process_refund(self, refund) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Initiates a refund with the payment provider.
        Returns:
        - is_successful: bool
        - provider_refund_id: str
        - raw_response: Dict
        """
        pass
