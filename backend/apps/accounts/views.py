from django.shortcuts import render
from . serializers import RegisterSerializer
from rest_framework import permissions 
from rest_framework import generics
import json
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth import authenticate
from . models import CustomUser
# Create your views here.
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        serializer.save(role=CustomUser.ROLE_CASHIER)

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, get_user_model
import json

User = get_user_model()

@csrf_exempt
def user_login(request):
    if request.method != "POST":
        return JsonResponse({"msg": "Only POST method allowed"}, status=405)

    try:
        data = json.loads(request.body)
        email = data.get("email")
        password = data.get("password")
    except json.JSONDecodeError:
        return JsonResponse({"bool": False, "msg": "Invalid JSON"}, status=400)

    # ✅ Authenticate using email instead of username
    try:
        user = authenticate(email=email, password=password)
    except User.DoesNotExist:
        user = None

    if user is not None:
        return JsonResponse({
            "user_login": True,
            "userId": user.id,
            "username": user.first_name+user.last_name,
            "email": user.email,
            "joined": user.date_joined.strftime("%Y-%m-%d"),
        })
    else:
        return JsonResponse({"bool": False, "msg": "Invalid credentials"}, status=401)

