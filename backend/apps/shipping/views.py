from decimal import Decimal
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import City, DeliveryHub, ShippingRate
from .serializers import CitySerializer, DeliveryHubSerializer, ShippingRateSerializer


class ShippingOptionsView(views.APIView):
    """
    Returns available Cameroon delivery options, pickup hubs, and rate tiers.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        cities = City.objects.all().select_related('region')
        hubs = DeliveryHub.objects.filter(is_active=True).select_related('city')
        rates = ShippingRate.objects.all().select_related('city')

        # Fallback realistic Cameroon defaults if database hasn't seeded shipping yet
        cities_data = CitySerializer(cities, many=True).data if cities.exists() else [
            {'id': 'douala', 'name': 'Douala', 'region_name': 'Littoral', 'is_major_hub': True},
            {'id': 'yaounde', 'name': 'Yaoundé', 'region_name': 'Centre', 'is_major_hub': True},
            {'id': 'bafoussam', 'name': 'Bafoussam', 'region_name': 'Ouest', 'is_major_hub': False},
            {'id': 'garoua', 'name': 'Garoua', 'region_name': 'Nord', 'is_major_hub': False},
            {'id': 'kribi', 'name': 'Kribi', 'region_name': 'Sud', 'is_major_hub': False},
            {'id': 'limbe', 'name': 'Limbé', 'region_name': 'Sud-Ouest', 'is_major_hub': False},
            {'id': 'bamenda', 'name': 'Bamenda', 'region_name': 'Nord-Ouest', 'is_major_hub': False},
        ]

        delivery_methods = [
            {
                'code': 'DOORSTEP_EXPRESS',
                'name': 'Livraison Express à Domicile',
                'description': 'Livraison sécurisée avec remise en mains propres contre signature et code SMS.',
                'estimated_delivery': '24h - 48h (Douala / Yaoundé)',
                'base_fee': 2000,
                'free_threshold': 150000,
            },
            {
                'code': 'AGENCY_PICKUP',
                'name': 'Retrait en Agence de Transport',
                'description': 'Colis scellé disponible en agence VIP (Touristique Express, Buca Voyages, Finexs).',
                'estimated_delivery': '24h - 72h selon la région',
                'base_fee': 1500,
                'free_threshold': 150000,
            },
            {
                'code': 'SHOWROOM_COLLECTION',
                'name': 'Retrait Privilège en Showroom FARÉL',
                'description': 'Accueil champagne et essayage personnalisé dans notre boutique à Douala Bonapriso.',
                'estimated_delivery': 'Disponible sous 2h',
                'base_fee': 0,
                'free_threshold': 0,
            },
        ]

        pickup_agencies = DeliveryHubSerializer(hubs, many=True).data if hubs.exists() else [
            {'agency_name': 'Touristique Express VIP', 'city_name': 'Yaoundé', 'branch_name': 'Agence Mvan', 'address_details': 'Face Total Mvan, Guichet Colis VIP', 'contact_phone': '+237 699 00 11 22'},
            {'agency_name': 'Buca Voyages VIP', 'city_name': 'Yaoundé', 'branch_name': 'Agence Mvan', 'address_details': 'Gare routière Mvan VIP', 'contact_phone': '+237 677 33 44 55'},
            {'agency_name': 'Finexs Voyages VIP', 'city_name': 'Douala', 'branch_name': 'Agence Akwa', 'address_details': 'Boulevard de la Liberté Akwa', 'contact_phone': '+237 690 55 66 77'},
            {'agency_name': 'FARÉL Showroom Boutique', 'city_name': 'Douala', 'branch_name': 'Maison FARÉL Bonapriso', 'address_details': 'Rue Tokoto, Bonapriso Douala', 'contact_phone': '+237 690 12 34 56'},
        ]

        return Response(
            {
                'cities': cities_data,
                'delivery_methods': delivery_methods,
                'pickup_agencies': pickup_agencies,
                'free_shipping_threshold': 150000,
                'currency': 'FCFA',
            },
            status=status.HTTP_200_OK,
        )


class CalculateShippingFeeView(views.APIView):
    """Calculates shipping fee for given city, delivery method and cart subtotal."""
    permission_classes = [AllowAny]

    def post(self, request):
        city = request.data.get('city', 'Douala')
        method = request.data.get('delivery_method', 'DOORSTEP_EXPRESS')
        subtotal = Decimal(str(request.data.get('subtotal', 0)))

        if method == 'SHOWROOM_COLLECTION':
            fee = Decimal('0')
            reason = "Retrait en boutique offert."
        elif subtotal >= Decimal('150000'):
            fee = Decimal('0')
            reason = "Livraison offerte dès 150 000 FCFA d'achats."
        else:
            city_lower = city.lower().strip()
            if 'douala' in city_lower:
                fee = Decimal('1500') if method == 'AGENCY_PICKUP' else Decimal('2000')
                reason = "Tarif standard Douala."
            elif 'yaound' in city_lower:
                fee = Decimal('2000') if method == 'AGENCY_PICKUP' else Decimal('3000')
                reason = "Tarif express Yaoundé."
            else:
                fee = Decimal('2500') if method == 'AGENCY_PICKUP' else Decimal('3500')
                reason = "Expédition interurbaine sécurisée."

        return Response({
            'city': city,
            'delivery_method': method,
            'subtotal': subtotal,
            'shipping_fee': fee,
            'is_free': fee == 0,
            'reason': reason,
            'currency': 'FCFA',
        }, status=status.HTTP_200_OK)
