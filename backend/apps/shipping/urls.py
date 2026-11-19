from django.urls import path
from .views import ShippingOptionsView, CalculateShippingFeeView

app_name = 'shipping'

urlpatterns = [
    path('options/', ShippingOptionsView.as_view(), name='shipping_options'),
    path('calculate-fee/', CalculateShippingFeeView.as_view(), name='calculate_fee'),
]
