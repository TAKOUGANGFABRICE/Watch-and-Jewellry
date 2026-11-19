from django.urls import path
from .views import (
    PaymentMethodsView,
    InitiatePaymentView,
    VerifyPaymentView,
    WebhookPaymentView,
    SimulatePaymentSuccessView,
    RefundCreateView,
)

app_name = 'payments'

urlpatterns = [
    path('methods/', PaymentMethodsView.as_view(), name='payment_methods'),
    path('initiate/', InitiatePaymentView.as_view(), name='initiate_payment'),
    path('verify/<str:transaction_ref>/', VerifyPaymentView.as_view(), name='verify_payment'),
    path('simulate-success/<str:transaction_ref>/', SimulatePaymentSuccessView.as_view(), name='simulate_success'),
    path('webhook/<str:provider_code>/', WebhookPaymentView.as_view(), name='payment_webhook'),
    path('refunds/', RefundCreateView.as_view(), name='refund_create'),
]
