from django.contrib import admin
from .models import Region, City, DeliveryHub, ShippingRate

@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')
    search_fields = ('name', 'code')

@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('name', 'region', 'is_major_hub')
    list_filter = ('region', 'is_major_hub')
    search_fields = ('name',)

@admin.register(DeliveryHub)
class DeliveryHubAdmin(admin.ModelAdmin):
    list_display = ('agency_name', 'branch_name', 'city', 'contact_phone', 'is_active')
    list_filter = ('city', 'agency_name', 'is_active')
    search_fields = ('agency_name', 'branch_name', 'address_details')

@admin.register(ShippingRate)
class ShippingRateAdmin(admin.ModelAdmin):
    list_display = ('city', 'delivery_type', 'fee', 'estimated_days_min', 'estimated_days_max', 'free_threshold')
    list_filter = ('delivery_type', 'city__region')

