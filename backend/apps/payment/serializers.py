from rest_framework import serializers
from .models import Payment
from apps.billing.models import Bill


class PaymentSerializer(serializers.ModelSerializer):
    bill_id = serializers.ReadOnlyField(source="bill.id")
    bill = serializers.PrimaryKeyRelatedField(queryset=Bill.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Payment
        fields = ["id","bill","transaction_id","amount","status","bill_id","created_at","updated_at"]
        read_only_fields = ["id","created_at","updated_at"]

    def create(self, validated_data):
        # Ensure transaction_id is unique
        transaction_id = validated_data.get('transaction_id')
        if transaction_id and Payment.objects.filter(transaction_id=transaction_id).exists():
            raise serializers.ValidationError({"transaction_id": "Payment with this transaction ID already exists."})
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Prevent changing transaction_id after creation
        if 'transaction_id' in validated_data and instance.transaction_id != validated_data['transaction_id']:
            if Payment.objects.filter(transaction_id=validated_data['transaction_id']).exclude(pk=instance.pk).exists():
                raise serializers.ValidationError({"transaction_id": "Payment with this transaction ID already exists."})
        
        return super().update(instance, validated_data)
