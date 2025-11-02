from rest_framework import serializers
from . models import Customer,CustomerLoyalty

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"
        depth=1


class CustomerLoyaltySerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerLoyalty
        fields = "__all__"