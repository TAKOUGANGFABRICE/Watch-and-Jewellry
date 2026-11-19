from django.db import models
from apps.core.models import BaseModel

class Region(BaseModel):
    """The 10 administrative regions of Cameroon."""
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True, help_text="e.g. LT for Littoral, CE for Centre")

    class Meta:
        verbose_name = 'Cameroon Region'
        verbose_name_plural = 'Cameroon Regions'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class City(BaseModel):
    """Cities and localities in Cameroon."""
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name='cities')
    name = models.CharField(max_length=100)
    is_major_hub = models.BooleanField(
        default=False,
        help_text="Douala and Yaoundé support same-day door courier dispatch"
    )

    class Meta:
        verbose_name = 'City'
        verbose_name_plural = 'Cities'
        ordering = ['name']
        unique_together = ('region', 'name')

    def __str__(self):
        return f"{self.name} ({self.region.code})"


class DeliveryHub(BaseModel):
    """Regional bus agency hubs or showroom pickup locations in Cameroon."""
    agency_name = models.CharField(
        max_length=150,
        help_text="e.g. Touristique Express, Buca Voyages, Finexs, FARÉL Showroom"
    )
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='delivery_hubs')
    branch_name = models.CharField(max_length=150, help_text="e.g. Agence Mvan, Agence Akwa")
    address_details = models.TextField(help_text="Precise neighborhood and landmark directions")
    contact_phone = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Delivery Hub / Agency'
        verbose_name_plural = 'Delivery Hubs / Agencies'
        ordering = ['city', 'agency_name', 'branch_name']

    def __str__(self):
        return f"{self.agency_name} - {self.branch_name} ({self.city.name})"


class ShippingRate(BaseModel):
    """Tiered shipping rates based on Cameroon city and fulfillment mode."""
    DELIVERY_TYPE_CHOICES = (
        ('DOORSTEP_EXPRESS', 'Doorstep Express Delivery'),
        ('AGENCY_PICKUP', 'Inter-City Agency Pickup'),
        ('SHOWROOM_COLLECTION', 'Showroom Boutique Collection'),
    )

    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='shipping_rates')
    delivery_type = models.CharField(max_length=30, choices=DELIVERY_TYPE_CHOICES)
    fee = models.DecimalField(max_digits=10, decimal_places=2, help_text="Fee in FCFA")
    estimated_days_min = models.PositiveIntegerField(default=1)
    estimated_days_max = models.PositiveIntegerField(default=2)
    free_threshold = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=150000,
        help_text="Orders above this amount receive free shipping (in FCFA)"
    )

    class Meta:
        verbose_name = 'Shipping Rate'
        verbose_name_plural = 'Shipping Rates'
        unique_together = ('city', 'delivery_type')

    def __str__(self):
        return f"{self.city.name} - {self.get_delivery_type_display()}: {self.fee} FCFA"

