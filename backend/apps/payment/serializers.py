from rest_framework import serializers
from .models import Payment


# class PaymentSerializer(serializers.ModelSerializer):
#     bill_id = serializers.ReadOnlyField(source="bill.id")

#     class Meta:
#         model = Payment
#         fields = "__all__"
#         read_only_fields = ("created_at", "updated_at")

#     def validate_transaction_id(self, value):
#         """Ensure unique transaction per gateway."""
#         if Payment.objects.filter(transaction_id=value).exists():
#             raise serializers.ValidationError("This transaction ID already exists.")
#         return value

# payments/serializers.py
from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    bill_id = serializers.ReadOnlyField(source="bill.id")

    class Meta:
        model = Payment
        fields = "__all__"

