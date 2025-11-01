from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    bill_id = serializers.ReadOnlyField(source="bill.id")

    class Meta:
        model = Payment
        fields = "__all__"
