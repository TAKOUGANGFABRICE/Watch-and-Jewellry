from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CheckoutCreateView,
    OrderTrackingView,
    MyOrdersViewSet,
)

app_name = 'orders'

router = DefaultRouter()
router.register('my-orders', MyOrdersViewSet, basename='my-orders')

urlpatterns = [
    path('checkout/', CheckoutCreateView.as_view(), name='checkout_create'),
    path('tracking/<str:order_number>/', OrderTrackingView.as_view(), name='order_tracking'),
    path('', include(router.urls)),
]
