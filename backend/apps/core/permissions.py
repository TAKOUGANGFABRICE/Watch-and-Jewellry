from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.is_superuser or request.user.role == 'SUPERADMIN')
        )

class IsStoreManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.is_superuser or request.user.role in ['STORE_MANAGER', 'SUPERADMIN'])
        )

class IsFulfillmentStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.is_superuser or request.user.role in ['FULFILLMENT_STAFF', 'STORE_MANAGER', 'SUPERADMIN'])
        )

class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.is_staff or request.user.role in ['STORE_MANAGER', 'SUPERADMIN'])
        )

class IsOwnerOrStaff(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_authenticated and (
            request.user.is_superuser or request.user.role in ['STORE_MANAGER', 'SUPERADMIN', 'FULFILLMENT_STAFF']
        ):
            return True
        user_attr = getattr(obj, 'user', None)
        return user_attr == request.user

