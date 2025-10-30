from rest_framework import serializers
from .models import Bill, BillItem
from apps.products.models import Product

class BillingItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = BillItem
        fields = ["id", "product", "product_name", "qty", "price"]
        depth=1

class BillingSerializer(serializers.ModelSerializer):
    items = BillingItemSerializer(many=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    class Meta:
        model = Bill
        fields = ["id", "bill_id", "customer", "customer_name", "subtotal", "tax", "total", "items", "created_at"]
        depth=1

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        customer = validated_data.pop("customer")
        billing = Bill.objects.create(customer=customer, **validated_data)

        for item in items_data:
            BillItem.objects.create(bill=billing, **item)

        return billing
