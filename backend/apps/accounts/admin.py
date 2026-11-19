from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Address, CustomerProfile

class CustomerProfileInline(admin.StackedInline):
    model = CustomerProfile
    can_delete = False
    verbose_name_plural = 'Customer Profile'

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = (CustomerProfileInline,)
    list_display = ('email', 'phone', 'first_name', 'last_name', 'role', 'language', 'is_verified', 'is_staff', 'is_active', 'created_at')
    list_filter = ('role', 'language', 'is_verified', 'is_staff', 'is_active', 'created_at')
    search_fields = ('email', 'phone', 'first_name', 'last_name')
    ordering = ('-created_at',)

    fieldsets = (
        (None, {'fields': ('email', 'phone', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'language')}),
        ('Role & Permissions', {'fields': ('role', 'is_verified', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Timestamps', {'fields': ('last_login',)}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'phone', 'role', 'language', 'password', 'first_name', 'last_name', 'is_staff', 'is_superuser'),
        }),
    )

@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'preferred_city', 'vip_tier', 'newsletter_subscribed', 'created_at')
    list_filter = ('vip_tier', 'preferred_city', 'newsletter_subscribed')
    search_fields = ('user__email', 'user__phone', 'user__first_name', 'user__last_name')

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('recipient_name', 'user', 'city', 'region', 'neighborhood', 'phone_number', 'is_default')
    list_filter = ('region', 'city', 'is_default')
    search_fields = ('recipient_name', 'phone_number', 'neighborhood', 'landmark', 'city')


