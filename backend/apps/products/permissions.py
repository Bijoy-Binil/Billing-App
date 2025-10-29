# users/permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS
from apps.accounts.models import CustomUser



class IsManager(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.role == CustomUser.ROLE_MANAGER)


class IsCashier(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.role == CustomUser.ROLE_CASHIER)


class IsManagerOrReadOnly(BasePermission):
    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.role == CustomUser.ROLE_MANAGER)