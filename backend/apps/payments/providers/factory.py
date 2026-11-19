from typing import Dict, Type
from .base import BasePaymentProvider
from .mtn_momo import MTNMoMoProvider
from .orange_money import OrangeMoneyProvider
from .notch_pay import NotchPayProvider
from .card_stripe import StripeCardProvider
from .cash_on_delivery import CashOnDeliveryProvider
from .bank_transfer import BankTransferProvider

PROVIDERS: Dict[str, Type[BasePaymentProvider]] = {
    'MTN_MOMO': MTNMoMoProvider,
    'ORANGE_MONEY': OrangeMoneyProvider,
    'NOTCH_PAY': NotchPayProvider,
    'CARD_STRIPE': StripeCardProvider,
    'CASH_ON_DELIVERY': CashOnDeliveryProvider,
    'BANK_TRANSFER': BankTransferProvider,
}

def get_payment_provider(provider_code: str) -> BasePaymentProvider:
    """
    Factory resolving provider code to provider implementation.
    Defaults to Notch Pay if code unknown.
    """
    provider_class = PROVIDERS.get(provider_code.upper(), NotchPayProvider)
    return provider_class()

def list_supported_providers() -> list:
    """List of active payment methods available for checkout."""
    return [
        {
            'code': 'MTN_MOMO',
            'name': 'MTN Mobile Money',
            'tagline': 'Débit instantané avec code secret *126#',
            'icon': 'momo',
            'is_local': True,
        },
        {
            'code': 'ORANGE_MONEY',
            'name': 'Orange Money Cameroun',
            'tagline': 'Paiement sécurisé via code #150#',
            'icon': 'orange',
            'is_local': True,
        },
        {
            'code': 'CARD_STRIPE',
            'name': 'Carte Bancaire (Visa / Mastercard)',
            'tagline': 'Paiement international sécurisé 3D-Secure',
            'icon': 'card',
            'is_local': False,
        },
        {
            'code': 'CASH_ON_DELIVERY',
            'name': 'Paiement à la Livraison',
            'tagline': 'Réglez en mains propres au coursier à Douala & Yaoundé',
            'icon': 'cash',
            'is_local': True,
        },
        {
            'code': 'BANK_TRANSFER',
            'name': 'Virement Bancaire Commercial',
            'tagline': 'Compte professionnel Afriland First Bank Cameroun',
            'icon': 'bank',
            'is_local': True,
        },
    ]
