from rest_framework import serializers
from .models import Region, City, DeliveryHub, ShippingRate


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ['id', 'name', 'code']


class CitySerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source='region.name', read_only=True)

    class Meta:
        model = City
        fields = ['id', 'name', 'region_name', 'is_major_hub']


class DeliveryHubSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)

    class Meta:
        model = DeliveryHub
        fields = [
            'id',
            'agency_name',
            'city_name',
            'branch_name',
            'address_details',
            'contact_phone',
        ]


class ShippingRateSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)

    class Meta:
        model = ShippingRate
        fields = [
            'id',
            'city_name',
            'delivery_type',
            'fee',
            'estimated_days_min',
            'estimated_days_max',
            'free_threshold',
        ]
