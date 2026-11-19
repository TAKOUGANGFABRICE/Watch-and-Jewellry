from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from apps.accounts.models import Address
from apps.catalog.models import Department, Category, Product, ProductVariant, ProductImage
from apps.inventory.models import StockRecord
from apps.shipping.models import Region, City, DeliveryHub, ShippingRate

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds initial Cameroonian luxury data for FARÉL (Accounts, Catalog, Shipping, Inventory)'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("==> Seeding FARÉL Database..."))

        # 1. Superadmin & Staff Users
        self.stdout.write("1. Creating staff & test customer accounts...")
        admin_user, _ = User.objects.get_or_create(
            email='admin@farel.cm',
            defaults={
                'phone': '+237699001122',
                'first_name': 'Armel',
                'last_name': 'Director',
                'role': 'SUPERADMIN',
                'language': 'fr',
                'is_staff': True,
                'is_superuser': True,
                'is_verified': True,
            }
        )
        admin_user.set_password('FarelLuxury2026!')
        admin_user.save()

        manager_user, _ = User.objects.get_or_create(
            email='manager@farel.cm',
            defaults={
                'phone': '+237677112233',
                'first_name': 'Béatrice',
                'last_name': 'Manager',
                'role': 'STORE_MANAGER',
                'language': 'fr',
                'is_staff': True,
                'is_verified': True,
            }
        )
        manager_user.set_password('FarelManager2026!')
        manager_user.save()

        customer_user, _ = User.objects.get_or_create(
            email='customer@farel.cm',
            defaults={
                'phone': '+237690123456',
                'first_name': 'Samuel',
                'last_name': 'Eto',
                'role': 'CUSTOMER',
                'language': 'fr',
                'is_verified': True,
            }
        )
        customer_user.set_password('FarelCustomer2026!')
        customer_user.save()

        # Add customer default Cameroon address
        Address.objects.get_or_create(
            user=customer_user,
            recipient_name='Samuel Eto',
            defaults={
                'phone_number': '+237690123456',
                'secondary_phone': '+237670987654',
                'region': 'Littoral',
                'city': 'Douala',
                'neighborhood': 'Bonapriso',
                'landmark': 'Rue des Palmiers, face Clinique Soppo, Villa Blanche',
                'is_default': True
            }
        )

        # 2. Shipping: Regions, Cities, Hubs, and Rates
        self.stdout.write("2. Seeding Cameroon regions, cities & transport agencies...")
        regions_data = [
            ('Littoral', 'LT'),
            ('Centre', 'CE'),
            ('Ouest', 'OU'),
            ('Sud', 'SU'),
            ('Sud-Ouest', 'SW'),
            ('Nord-Ouest', 'NW'),
            ('Adamaoua', 'AD'),
            ('Nord', 'NO'),
            ('Extrême-Nord', 'EN'),
            ('Est', 'ES'),
        ]
        created_regions = {}
        for r_name, r_code in regions_data:
            reg, _ = Region.objects.get_or_create(name=r_name, defaults={'code': r_code})
            created_regions[r_name] = reg

        # Major Cities
        cities_data = [
            ('Douala', created_regions['Littoral'], True),
            ('Yaoundé', created_regions['Centre'], True),
            ('Bafoussam', created_regions['Ouest'], False),
            ('Kribi', created_regions['Sud'], False),
            ('Limbe', created_regions['Sud-Ouest'], False),
            ('Garoua', created_regions['Nord'], False),
        ]
        created_cities = {}
        for c_name, reg_obj, is_hub in cities_data:
            city, _ = City.objects.get_or_create(region=reg_obj, name=c_name, defaults={'is_major_hub': is_hub})
            created_cities[c_name] = city

        # Delivery Hubs (Agencies)
        hubs_data = [
            ("Touristique Express", created_cities['Douala'], "Agence Akwa", "Boulevard de la Liberté, face Hôtel Somatel", "+237699112233"),
            ("Touristique Express", created_cities['Yaoundé'], "Agence Mvan", "Terminus Mvan, carrefour des agences", "+237699445566"),
            ("Buca Voyages", created_cities['Douala'], "Agence Mboppi", "Près du rond-point Mboppi", "+237677889900"),
            ("Buca Voyages", created_cities['Yaoundé'], "Agence Mvan", "Entrée gare routière Mvan", "+237677113355"),
            ("Finexs Voyages", created_cities['Douala'], "Agence Akwa Centrale", "Rue Joss, face Bicec", "+237695001122"),
            ("FARÉL Showroom", created_cities['Douala'], "Boutique Bonapriso", "Avenue De Gaulle, Immeuble Prestige", "+237690000001"),
            ("FARÉL Showroom", created_cities['Yaoundé'], "Boutique Bastos", "Rue des Ambassades, Bastos", "+237690000002"),
        ]
        for ag_name, c_obj, b_name, addr, tel in hubs_data:
            DeliveryHub.objects.get_or_create(
                agency_name=ag_name,
                city=c_obj,
                branch_name=b_name,
                defaults={'address_details': addr, 'contact_phone': tel, 'is_active': True}
            )

        # Shipping Rates
        for city_name, city_obj in created_cities.items():
            if city_obj.is_major_hub:  # Douala / Yaoundé
                ShippingRate.objects.get_or_create(
                    city=city_obj,
                    delivery_type='DOORSTEP_EXPRESS',
                    defaults={
                        'fee': Decimal('2000.00'),
                        'estimated_days_min': 1,
                        'estimated_days_max': 1,
                        'free_threshold': Decimal('150000.00')
                    }
                )
            else:  # Inter-city regional hubs
                ShippingRate.objects.get_or_create(
                    city=city_obj,
                    delivery_type='AGENCY_PICKUP',
                    defaults={
                        'fee': Decimal('4000.00'),
                        'estimated_days_min': 2,
                        'estimated_days_max': 3,
                        'free_threshold': Decimal('150000.00')
                    }
                )
            # Showroom Pickup
            ShippingRate.objects.get_or_create(
                city=city_obj,
                delivery_type='SHOWROOM_COLLECTION',
                defaults={
                    'fee': Decimal('0.00'),
                    'estimated_days_min': 0,
                    'estimated_days_max': 1,
                    'free_threshold': Decimal('0.00')
                }
            )

        # 3. Catalog: Departments & Categories
        self.stdout.write("3. Seeding Watches & Jewellery Departments...")
        dept_watches, _ = Department.objects.get_or_create(
            slug='watches',
            defaults={
                'name': 'Watches',
                'description': 'Haute Horlogerie — Exceptional timepieces crafted with Swiss and Japanese precision.'
            }
        )

        dept_jewellery, _ = Department.objects.get_or_create(
            slug='jewellery',
            defaults={
                'name': 'Jewellery',
                'description': 'Fine Jewellery — Certified 18k Gold, natural diamonds and bespoke handcrafted gems.'
            }
        )

        cat_chrono, _ = Category.objects.get_or_create(
            department=dept_watches,
            slug='chronographes',
            defaults={'name': 'Chronographes & Sport'}
        )
        cat_auto, _ = Category.objects.get_or_create(
            department=dept_watches,
            slug='automatiques',
            defaults={'name': 'Montres Automatiques'}
        )
        cat_diver, _ = Category.objects.get_or_create(
            department=dept_watches,
            slug='plongeuses',
            defaults={'name': 'Plongeuses Professionnelles'}
        )

        cat_rings, _ = Category.objects.get_or_create(
            department=dept_jewellery,
            slug='solitaires-bagues',
            defaults={'name': 'Bagues de Fiançailles & Solitaires'}
        )
        cat_necklaces, _ = Category.objects.get_or_create(
            department=dept_jewellery,
            slug='colliers-or',
            defaults={'name': 'Colliers & Pendentifs 18k'}
        )
        cat_bracelets, _ = Category.objects.get_or_create(
            department=dept_jewellery,
            slug='bracelets-joncs',
            defaults={'name': 'Bracelets & Joncs en Or'}
        )

        # 4. Products, Variants & Inventory
        self.stdout.write("4. Seeding Products, Variants and Stock Records...")

        # --- PRODUCT 1: FARÉL Chrono Heritage ---
        p1, _ = Product.objects.get_or_create(
            slug='farel-atelier-chrono-heritage-41',
            defaults={
                'category': cat_chrono,
                'department_type': 'WATCH',
                'name': 'Chrono Heritage 41',
                'brand': 'FARÉL Atelier',
                'short_description': 'Chronographe automatique 41mm en acier inoxydable avec verre saphir inrayable.',
                'description': (
                    'Le Chrono Heritage 41 incarne l’élégance intemporelle de la maison FARÉL. '
                    'Équipé d’un mouvement chronographe automatique suisse, d’un cadran soleillé aux reflets bleus '
                    'et d’une réserve de marche de 48 heures. Étanche à 100 mètres.'
                ),
                'base_price': Decimal('385000.00'),
                'is_featured': True,
                'department_specs': {
                    'movement': 'Automatique Calibre F-7750',
                    'case_diameter': '41 mm',
                    'water_resistance': '100m (10 ATM)',
                    'glass': 'Saphir bombé antireflet',
                    'case_material': 'Acier inoxydable 316L',
                    'warranty': '3 ans garantie internationale'
                }
            }
        )
        # Variants for P1
        v1_1, _ = ProductVariant.objects.get_or_create(
            product=p1,
            sku='FRL-CH-41-BLEU-CUIR',
            defaults={
                'title': 'Cadran Bleu / Bracelet Cuir Alligator',
                'attributes': {'dial_color': 'Bleu Nuit', 'strap_type': 'Cuir Alligator'},
                'is_default': True
            }
        )
        StockRecord.objects.get_or_create(
            variant=v1_1,
            defaults={'quantity_available': 6, 'quantity_reserved': 0, 'low_stock_threshold': 2}
        )

        v1_2, _ = ProductVariant.objects.get_or_create(
            product=p1,
            sku='FRL-CH-41-BLEU-ACIER',
            defaults={
                'title': 'Cadran Bleu / Bracelet Acier 316L',
                'price_override': Decimal('410000.00'),
                'attributes': {'dial_color': 'Bleu Nuit', 'strap_type': 'Acier 316L'},
                'is_default': False
            }
        )
        StockRecord.objects.get_or_create(
            variant=v1_2,
            defaults={'quantity_available': 4, 'quantity_reserved': 0, 'low_stock_threshold': 2}
        )

        # --- PRODUCT 2: Tissot PRX Powermatic 80 ---
        p2, _ = Product.objects.get_or_create(
            slug='tissot-prx-powermatic-80',
            defaults={
                'category': cat_auto,
                'department_type': 'WATCH',
                'name': 'PRX Powermatic 80',
                'brand': 'Tissot',
                'short_description': 'Montre suisse automatique au boîtier tonneau rétro avec 80h de réserve de marche.',
                'description': (
                    'Fine, robuste et résolument design années 70. La Tissot PRX Powermatic 80 '
                    'dispose du mouvement innovant avec spiral en Nivachron résistant aux champs magnétiques. '
                    'Garantie d’authenticité et certificat suisse inclus.'
                ),
                'base_price': Decimal('495000.00'),
                'is_featured': True,
                'department_specs': {
                    'movement': 'Swiss Made Powermatic 80.111',
                    'case_diameter': '40 mm',
                    'water_resistance': '100m (10 ATM)',
                    'glass': 'Glace saphir inrayable',
                    'case_material': 'Acier inoxydable 316L satiné',
                    'power_reserve': 'Jusqu’à 80 heures'
                }
            }
        )
        v2_1, _ = ProductVariant.objects.get_or_create(
            product=p2,
            sku='TIS-PRX-80-VERT',
            defaults={
                'title': 'Cadran Vert Forêt Gaufré',
                'attributes': {'dial_color': 'Vert Forêt', 'strap_type': 'Acier Intégré'},
                'is_default': True
            }
        )
        StockRecord.objects.get_or_create(
            variant=v2_1,
            defaults={'quantity_available': 5, 'quantity_reserved': 0, 'low_stock_threshold': 2}
        )

        # --- PRODUCT 3: Solitaire Étoile de Douala 18k ---
        p3, _ = Product.objects.get_or_create(
            slug='farel-atelier-solitaire-etoile-de-douala-18k',
            defaults={
                'category': cat_rings,
                'department_type': 'JEWELLERY',
                'name': 'Solitaire Étoile de Douala 18k',
                'brand': 'FARÉL Atelier',
                'short_description': 'Bague de fiançailles en or jaune 18 carats avec diamant naturel taille brillant 0.75ct.',
                'description': (
                    'Une pièce de haute joaillerie façonnée à la main. Sertie d’un diamant rond brillant '
                    'de 0.75 carat, couleur F, pureté VVS1, certifié GIA. Corps de bague en or jaune 18 carats (750/1000). '
                    'Gravure personnalisée offerte.'
                ),
                'base_price': Decimal('650000.00'),
                'is_featured': True,
                'department_specs': {
                    'metal': 'Or Jaune 18K (Poinçon 750)',
                    'gemstone': 'Diamant Naturel',
                    'carat_weight': '0.75 carat',
                    'clarity': 'VVS1',
                    'color_grade': 'F (Blanc Extra Exceptionnel)',
                    'cut_grade': 'Excellent',
                    'certification': 'GIA + Certificat FARÉL'
                }
            }
        )
        for ring_size in ['52', '54', '56']:
            v_ring, _ = ProductVariant.objects.get_or_create(
                product=p3,
                sku=f'FRL-SOL-18K-T{ring_size}',
                defaults={
                    'title': f'Taille {ring_size} (Tour de doigt)',
                    'attributes': {'ring_size': ring_size, 'metal': 'Or Jaune 18k'},
                    'is_default': (ring_size == '54')
                }
            )
            StockRecord.objects.get_or_create(
                variant=v_ring,
                defaults={'quantity_available': 3, 'quantity_reserved': 0, 'low_stock_threshold': 1}
            )

        # --- PRODUCT 4: Pendentif Diamant & Or Jaune 18k ---
        p4, _ = Product.objects.get_or_create(
            slug='farel-atelier-pendentif-diamant-or-jaune-18k',
            defaults={
                'category': cat_necklaces,
                'department_type': 'JEWELLERY',
                'name': 'Pendentif Goutte d’Or & Diamant 18k',
                'brand': 'FARÉL Atelier',
                'short_description': 'Chaîne forçat et pendentif serti clos d’un diamant 0.40ct en or 18k.',
                'description': (
                    'Un éclat subtil et somptueux au creux du cou. Livré dans son écrin de velours FARÉL '
                    'avec son certificat d’authenticité et de garantie à vie contre tout vice de fabrication.'
                ),
                'base_price': Decimal('420000.00'),
                'is_featured': True,
                'department_specs': {
                    'metal': 'Or Jaune 18K (750/1000)',
                    'chain_length': '42 - 45 cm réglable',
                    'gemstone': 'Diamant Solitaire 0.40 carat',
                    'gold_weight': '4.8 grammes'
                }
            }
        )
        v4_1, _ = ProductVariant.objects.get_or_create(
            product=p4,
            sku='FRL-PEND-18K-ORJ',
            defaults={
                'title': 'Or Jaune 18 Carats / Chaîne 45cm',
                'attributes': {'metal_color': 'Or Jaune', 'length': '45cm'},
                'is_default': True
            }
        )
        StockRecord.objects.get_or_create(
            variant=v4_1,
            defaults={'quantity_available': 5, 'quantity_reserved': 0, 'low_stock_threshold': 1}
        )

        self.stdout.write(self.style.SUCCESS("==> FARÉL Database seeded successfully!"))
        self.stdout.write(self.style.SUCCESS(f"Accounts: SuperAdmin (admin@farel.cm), Manager (manager@farel.cm), Customer (customer@farel.cm)"))
        self.stdout.write(self.style.SUCCESS(f"Catalog: 2 Departments, 6 Categories, 4 Luxury Products, 7 Variants with real-time stock."))

