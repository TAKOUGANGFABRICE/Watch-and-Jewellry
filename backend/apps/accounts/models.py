from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.core.models import BaseModel
from apps.core.utils import normalize_cameroon_phone, is_valid_cameroon_phone

class UserManager(BaseUserManager):
    """Custom user manager supporting email or Cameroon phone registration."""

    def create_user(self, email=None, phone=None, password=None, **extra_fields):
        if not email and not phone:
            raise ValueError('Either an email address or a valid phone number must be provided.')

        if email:
            email = self.normalize_email(email).lower()

        if phone:
            phone = normalize_cameroon_phone(phone)

        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'CUSTOMER')

        user = self.model(email=email, phone=phone, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'SUPERADMIN')
        extra_fields.setdefault('is_verified', True)

        if not email:
            raise ValueError('Superusers must have an email address.')

        return self.create_user(email=email, password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    """Custom User model for FARÉL platform."""

    ROLE_CHOICES = (
        ('CUSTOMER', 'Customer'),
        ('STORE_MANAGER', 'Store Manager'),
        ('FULFILLMENT_STAFF', 'Fulfillment & Logistics Staff'),
        ('SUPERADMIN', 'Super Administrator'),
    )

    LANGUAGE_CHOICES = (
        ('en', 'English'),
        ('fr', 'Français'),
    )

    email = models.EmailField(unique=True, null=True, blank=True, db_index=True)
    phone = models.CharField(max_length=30, unique=True, null=True, blank=True, db_index=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='CUSTOMER', db_index=True)
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='fr', db_index=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']

    def __str__(self):
        name = self.get_full_name()
        identifier = self.email or self.phone or str(self.id)
        return f"{name} ({identifier})" if name else identifier

    def get_full_name(self):
        full = f"{self.first_name} {self.last_name}".strip()
        return full or (self.email or self.phone or 'Customer')

    @property
    def is_admin_user(self):
        return self.role in ['STORE_MANAGER', 'SUPERADMIN'] or self.is_superuser

    @property
    def customer_profile(self):
        profile, _ = CustomerProfile.objects.get_or_create(user=self)
        return profile


class CustomerProfile(BaseModel):
    """Extended customer profile storing preferences and loyalty stats."""

    VIP_TIER_CHOICES = (
        ('STANDARD', 'Standard Privilège'),
        ('SILVER', 'Argent Privilège'),
        ('GOLD', 'Or Privilège'),
        ('PLATINUM', 'Platine Concierge'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    preferred_city = models.CharField(max_length=100, default='Douala', help_text="Default Cameroon city for delivery estimations")
    date_of_birth = models.DateField(null=True, blank=True)
    avatar = models.ImageField(upload_to='profiles/avatars/', null=True, blank=True)
    newsletter_subscribed = models.BooleanField(default=False)
    vip_tier = models.CharField(max_length=20, choices=VIP_TIER_CHOICES, default='STANDARD')
    notes = models.TextField(blank=True, help_text="Concierge and customer preference notes")

    class Meta:
        verbose_name = 'Customer Profile'
        verbose_name_plural = 'Customer Profiles'

    def __str__(self):
        return f"Profile for {self.user.get_full_name()}"


class Address(BaseModel):
    """Customer shipping address tailored to Cameroon location structure."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    recipient_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=30, help_text="Primary WhatsApp or calling number")
    secondary_phone = models.CharField(max_length=30, blank=True, help_text="Backup phone number")
    region = models.CharField(max_length=100, help_text="e.g. Littoral, Centre, Ouest")
    city = models.CharField(max_length=100, help_text="e.g. Douala, Yaoundé, Bafoussam")
    neighborhood = models.CharField(max_length=150, help_text="e.g. Bonapriso, Bastos, Akwa, Makepe")
    landmark = models.TextField(blank=True, help_text="e.g. Face Boulangerie Zepol, barrière noire")
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Shipping Address'
        verbose_name_plural = 'Shipping Addresses'
        ordering = ['-is_default', '-created_at']

    def save(self, *args, **kwargs):
        if self.phone_number:
            self.phone_number = normalize_cameroon_phone(self.phone_number)
        if self.secondary_phone:
            self.secondary_phone = normalize_cameroon_phone(self.secondary_phone)
        if self.is_default:
            # Unmark other defaults for this user
            Address.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.recipient_name} - {self.neighborhood}, {self.city} ({self.phone_number})"


@receiver(post_save, sender=User)
def create_customer_profile(sender, instance, created, **kwargs):
    if created and instance.role == 'CUSTOMER':
        CustomerProfile.objects.get_or_create(user=instance)


