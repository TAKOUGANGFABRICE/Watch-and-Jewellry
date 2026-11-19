from django.contrib import admin
from .models import Order, OrderItem, OrderAddress, OrderStatusHistory

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product_name', 'variant_title', 'sku', 'unit_price', 'quantity', 'total_price')

class OrderAddressInline(admin.StackedInline):
    model = OrderAddress
    can_delete = False

class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ('status', 'comment', 'changed_by', 'created_at')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'customer_name', 'customer_phone', 'customer_email', 'total_amount', 'currency', 'order_status', 'payment_status', 'fulfillment_status', 'delivery_method', 'created_at')
    list_filter = ('order_status', 'payment_status', 'fulfillment_status', 'delivery_method', 'created_at')
    search_fields = ('order_number', 'customer_name', 'customer_phone', 'customer_email')
    readonly_fields = ('order_number', 'subtotal', 'discount_amount', 'shipping_fee', 'total_amount', 'created_at')
    inlines = [OrderAddressInline, OrderItemInline, OrderStatusHistoryInline]

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product_name', 'variant_title', 'sku', 'unit_price', 'quantity', 'total_price')
    search_fields = ('order__order_number', 'product_name', 'sku')

@admin.register(OrderAddress)
class OrderAddressAdmin(admin.ModelAdmin):
    list_display = ('order', 'recipient_name', 'primary_phone', 'city', 'neighborhood')
    search_fields = ('recipient_name', 'primary_phone', 'city', 'neighborhood')

@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('order', 'status', 'changed_by', 'created_at')

