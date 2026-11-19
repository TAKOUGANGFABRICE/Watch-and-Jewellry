from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Address, CustomerProfile
from apps.core.utils import normalize_cameroon_phone, is_valid_cameroon_phone


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = ['preferred_city', 'date_of_birth', 'avatar', 'newsletter_subscribed', 'vip_tier', 'notes']
        read_only_fields = ['vip_tier']


class UserSerializer(serializers.ModelSerializer):
    """Safe user serializer returning customer information without sensitive credentials."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    profile = CustomerProfileSerializer(source='customer_profile', read_only=True)
    saved_addresses_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'phone',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'language',
            'is_staff',
            'is_active',
            'is_verified',
            'created_at',
            'profile',
            'saved_addresses_count',
        ]
        read_only_fields = ['id', 'role', 'is_staff', 'is_active', 'is_verified', 'created_at']

    def get_saved_addresses_count(self, obj) -> int:
        return obj.addresses.count()


class UserRegistrationSerializer(serializers.Serializer):
    """Handles customer registration with email or Cameroon phone validation."""
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    language = serializers.ChoiceField(choices=User.LANGUAGE_CHOICES, default='fr')
    preferred_city = serializers.CharField(max_length=100, default='Douala', required=False)
    newsletter_subscribed = serializers.BooleanField(default=False, required=False)

    def validate(self, attrs):
        email = attrs.get('email')
        phone = attrs.get('phone')
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')

        if not email and not phone:
            raise serializers.ValidationError({
                'identifier': "Veuillez fournir une adresse email ou un numéro de téléphone camerounais."
            })

        if email:
            email_normalized = email.lower().strip()
            if User.objects.filter(email=email_normalized).exists():
                raise serializers.ValidationError({'email': "Un compte avec cette adresse email existe déjà."})
            attrs['email'] = email_normalized

        if phone:
            normalized_phone = normalize_cameroon_phone(phone)
            if not is_valid_cameroon_phone(normalized_phone):
                raise serializers.ValidationError({
                    'phone': "Le numéro de téléphone doit être un numéro camerounais valide (ex: +237 6XXXXXXXX ou 6XXXXXXXX)."
                })
            if User.objects.filter(phone=normalized_phone).exists():
                raise serializers.ValidationError({'phone': "Ce numéro de téléphone est déjà associé à un compte."})
            attrs['phone'] = normalized_phone

        if password != password_confirm:
            raise serializers.ValidationError({'password_confirm': "Les deux mots de passe ne correspondent pas."})

        # Validate password strength against Django rules
        validate_password(password)

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        preferred_city = validated_data.pop('preferred_city', 'Douala')
        newsletter_subscribed = validated_data.pop('newsletter_subscribed', False)

        user = User.objects.create_user(
            email=validated_data.get('email') or None,
            phone=validated_data.get('phone') or None,
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            language=validated_data.get('language', 'fr'),
            role='CUSTOMER',
        )

        profile = user.customer_profile
        profile.preferred_city = preferred_city
        profile.newsletter_subscribed = newsletter_subscribed
        profile.save()

        return user


class UserLoginSerializer(serializers.Serializer):
    """Authenticates by email OR Cameroon phone, returns user payload and JWT tokens."""
    identifier = serializers.CharField(required=True, help_text="Adresse email ou numéro de téléphone camerounais")
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        identifier = attrs.get('identifier', '').strip()
        password = attrs.get('password')

        user = None

        if '@' in identifier:
            # Match by email
            user = User.objects.filter(email__iexact=identifier).first()
        else:
            # Match by normalized phone
            norm_phone = normalize_cameroon_phone(identifier)
            user = User.objects.filter(phone=norm_phone).first()
            if not user:
                # Fallback to direct phone match
                user = User.objects.filter(phone=identifier).first()

        if not user or not user.check_password(password):
            raise serializers.ValidationError({
                'detail': "Identifiants invalides. Veuillez vérifier votre email/téléphone et votre mot de passe."
            })

        if not user.is_active:
            raise serializers.ValidationError({
                'detail': "Ce compte a été désactivé. Veuillez contacter le service client FARÉL."
            })

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return {
            'user': user,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Allows authenticated user to update their personal info and profile."""
    preferred_city = serializers.CharField(required=False, write_only=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True, write_only=True)
    newsletter_subscribed = serializers.BooleanField(required=False, write_only=True)

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'phone',
            'language',
            'preferred_city',
            'date_of_birth',
            'newsletter_subscribed',
        ]

    def validate_phone(self, value):
        if not value:
            return None
        normalized = normalize_cameroon_phone(value)
        if not is_valid_cameroon_phone(normalized):
            raise serializers.ValidationError("Numéro camerounais invalide (+237 6XXXXXXXX).")
        # Check uniqueness excluding self
        user = self.context['request'].user
        if User.objects.filter(phone=normalized).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Ce numéro de téléphone est déjà utilisé par un autre compte.")
        return normalized

    def update(self, instance, validated_data):
        preferred_city = validated_data.pop('preferred_city', None)
        date_of_birth = validated_data.pop('date_of_birth', None)
        newsletter_subscribed = validated_data.pop('newsletter_subscribed', None)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        # Update customer profile
        profile = instance.customer_profile
        if preferred_city is not None:
            profile.preferred_city = preferred_city
        if date_of_birth is not None:
            profile.date_of_birth = date_of_birth
        if newsletter_subscribed is not None:
            profile.newsletter_subscribed = newsletter_subscribed
        profile.save()

        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """Allows an authenticated user to change their password securely."""
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, required=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Le mot de passe actuel est incorrect.")
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': "Les nouveaux mots de passe ne correspondent pas."})
        user = self.context['request'].user
        validate_password(attrs['new_password'], user=user)
        return attrs

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """Requests a password reset token by email or phone."""
    identifier = serializers.CharField(required=True)

    def validate_identifier(self, value):
        val = value.strip()
        user = None
        if '@' in val:
            user = User.objects.filter(email__iexact=val).first()
        else:
            norm = normalize_cameroon_phone(val)
            user = User.objects.filter(phone=norm).first()
        if not user:
            # We still return the input to avoid account enumeration
            return {'user': None, 'identifier': val}
        return {'user': user, 'identifier': val}


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Confirms password reset using uidb64 and token."""
    uidb64 = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    new_password_confirm = serializers.CharField(required=True, min_length=8)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': "Les mots de passe ne correspondent pas."})

        try:
            uid = force_str(urlsafe_base64_decode(attrs['uidb64']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({'token': "Lien de réinitialisation invalide ou expiré."})

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError({'token': "Ce jeton de réinitialisation est invalide ou a expiré."})

        validate_password(attrs['new_password'], user=user)
        attrs['user'] = user
        return attrs

    def save(self):
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class AddressSerializer(serializers.ModelSerializer):
    """Serializer for customer shipping addresses in Cameroon with strict data isolation."""
    class Meta:
        model = Address
        fields = [
            'id',
            'recipient_name',
            'phone_number',
            'secondary_phone',
            'region',
            'city',
            'neighborhood',
            'landmark',
            'is_default',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_phone_number(self, value):
        normalized = normalize_cameroon_phone(value)
        if not is_valid_cameroon_phone(normalized):
            raise serializers.ValidationError("Le numéro principal doit être un numéro camerounais valide (+237 6XXXXXXXX).")
        return normalized

    def validate_secondary_phone(self, value):
        if not value:
            return ""
        normalized = normalize_cameroon_phone(value)
        if not is_valid_cameroon_phone(normalized):
            raise serializers.ValidationError("Le numéro secondaire doit être un numéro camerounais valide (+237 6XXXXXXXX).")
        return normalized

    def create(self, validated_data):
        user = validated_data.pop('user', None)
        if not user and 'request' in self.context:
            user = self.context['request'].user
        return Address.objects.create(user=user, **validated_data)
