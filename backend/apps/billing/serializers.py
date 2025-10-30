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
        fields = [
            "id",
            "bill_id",
            "customer",
            "customer_name",
            "subtotal",
            "tax",
            "discount",   # ✅ include discount
            "total",
            "items",
            "created_at",
        ]
        read_only_fields = ["bill_id", "created_at"]
        depth=1
    def create(self, validated_data):
        # ✅ Safe extraction (no KeyError)
        items_data = validated_data.pop("items", [])
        customer = validated_data.get("customer")

        if not customer:
            raise serializers.ValidationError({"customer": "Customer is required"})

        # ✅ Create main bill
        billing = Bill.objects.create(**validated_data)

        # ✅ Create nested items
        for item_data in items_data:
            BillItem.objects.create(bill=billing, **item_data)

        return billing
