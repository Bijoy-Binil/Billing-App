from rest_framework import serializers
from . models import  CustomUser
from django.contrib.auth.password_validation import validate_password
from typing import Any

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ("id", "email", "first_name", "last_name", "role")
        read_only_fields = ("id", "role")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ("email", "password", "first_name", "last_name", "role")

    def create(self, validated_data):
        # Extract password separately
        password = validated_data.pop("password")

        # Create user object
        user = CustomUser(**validated_data)
        print("validated_data==>",validated_data)
        # Validate and set password
        validate_password(password, user)
        user.set_password(password)
        user.save()

        return user