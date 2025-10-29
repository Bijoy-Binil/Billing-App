from django.shortcuts import render
from . serializers import RegisterSerializer
from rest_framework import permissions 
from rest_framework import generics
from . models import CustomUser
# Create your views here.
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        serializer.save(role=CustomUser.ROLE_CASHIER)
