from django.contrib import admin
from .models import StockRecord, StockMovementLog

@admin.register(StockRecord)
class StockRecordAdmin(admin.ModelAdmin):
    list_display = ('variant', 'quantity_available', 'quantity_reserved', 'low_stock_threshold', 'is_available', 'is_low_stock')
    list_filter = ('quantity_available',)
    search_fields = ('variant__sku', 'variant__title', 'variant__product__name')

@admin.register(StockMovementLog)
class StockMovementLogAdmin(admin.ModelAdmin):
    list_display = ('variant', 'movement_type', 'quantity_changed', 'previous_quantity', 'new_quantity', 'actor', 'created_at')
    list_filter = ('movement_type', 'created_at')
    search_fields = ('variant__sku', 'reason')
    readonly_fields = ('variant', 'movement_type', 'quantity_changed', 'previous_quantity', 'new_quantity', 'reason', 'actor', 'created_at')

