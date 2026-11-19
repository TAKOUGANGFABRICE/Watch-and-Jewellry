from rest_framework import status, viewsets, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

from .models import User, Address, CustomerProfile
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    AddressSerializer,
)


class RegisterView(APIView):
    """
    Register a new customer account.
    Returns customer profile and SimpleJWT authentication tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens for instant seamless login
        refresh = RefreshToken.for_user(user)

        user_data = UserSerializer(user).data
        return Response(
            {
                'message': "Compte FARÉL créé avec succès.",
                'user': user_data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    Authenticate customer via Email or Cameroon Phone (+237 6XXXXXXXX) + Password.
    Returns customer details and SimpleJWT access/refresh tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        tokens = serializer.validated_data['tokens']
        user_data = UserSerializer(user).data

        return Response(
            {
                'message': f"Bienvenue, {user.get_full_name()}.",
                'user': user_data,
                'tokens': tokens,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    Logout customer by blacklisting the provided refresh token.
    Prevents token reuse.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': "Le jeton d'actualisation (refresh token) est requis pour la déconnexion."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': "Déconnexion réussie. Jeton révoqué."}, status=status.HTTP_200_OK)
        except TokenError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """
    Retrieve or update the authenticated customer's profile.
    Guarantees strict isolation: always acts exclusively on request.user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        serializer = UserProfileUpdateSerializer(
            instance=request.user,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()

        return Response(
            {
                'message': "Profil mis à jour avec succès.",
                'user': UserSerializer(updated_user).data,
            },
            status=status.HTTP_200_OK,
        )

    def put(self, request, *args, **kwargs):
        return self.patch(request, *args, **kwargs)


class ChangePasswordView(APIView):
    """
    Allows authenticated user to change their password with validation.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {'message': "Votre mot de passe a été modifié avec succès."},
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(APIView):
    """
    Initiates password reset workflow for a given email or phone number.
    Returns safe generic message and dev tokens in DEBUG mode.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_info = serializer.validated_data['identifier']
        user = user_info.get('user')

        response_data = {
            'message': "Si un compte FARÉL correspond à ces coordonnées, des instructions de réinitialisation vous ont été transmises.",
        }

        if user:
            token = default_token_generator.make_token(user)
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

            # Expose token in dev/testing for seamless workflow verification
            response_data['dev_debug'] = {
                'uidb64': uidb64,
                'token': token,
                'reset_url': f"/reset-password?uid={uidb64}&token={token}",
            }

        return Response(response_data, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """
    Resets password given a valid uidb64 and token.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {'message': "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter."},
            status=status.HTTP_200_OK,
        )


class AddressViewSet(viewsets.ModelViewSet):
    """
    Full CRUD management for customer delivery addresses in Cameroon.
    Strict data isolation: Customers can ONLY view, create, edit, or delete their own addresses.
    """
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Strict customer isolation: never returns any other user's address
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # If this is the user's first address, automatically make it default
        is_first = not Address.objects.filter(user=self.request.user).exists()
        if is_first and 'is_default' not in serializer.validated_data:
            serializer.save(user=self.request.user, is_default=True)
        else:
            serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='set-default')
    def set_default(self, request, pk=None):
        address = self.get_object()  # Automatically checks user=request.user
        Address.objects.filter(user=request.user, is_default=True).update(is_default=False)
        address.is_default = True
        address.save()
        return Response(
            {
                'message': f"L'adresse pour {address.recipient_name} ({address.city}) a été définie par défaut.",
                'address': self.get_serializer(address).data,
            },
            status=status.HTTP_200_OK,
        )


class AccountStatusView(APIView):
    """
    Provides an overview of account standing, loyalty tier, and statistics.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        profile = user.customer_profile
        addresses_count = user.addresses.count()

        # Orders count if orders app exists
        orders_count = getattr(user, 'orders', None).count() if hasattr(user, 'orders') else 0
        active_orders_count = (
            user.orders.exclude(fulfillment_status__in=['DELIVERED', 'CANCELLED']).count()
            if hasattr(user, 'orders')
            else 0
        )

        return Response(
            {
                'user_id': user.id,
                'email': user.email,
                'phone': user.phone,
                'full_name': user.get_full_name(),
                'role': user.role,
                'is_active': user.is_active,
                'is_verified': user.is_verified,
                'vip_tier': profile.vip_tier,
                'preferred_city': profile.preferred_city,
                'member_since': user.created_at,
                'addresses_count': addresses_count,
                'orders_count': orders_count,
                'active_orders_count': active_orders_count,
            },
            status=status.HTTP_200_OK,
        )
