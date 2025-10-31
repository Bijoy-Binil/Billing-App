from rest_framework import serializers
from .models import Bill, BillItem
from apps.products.models import Product
from apps.customers.models import Customer  # ✅ ensure correct import path

class BillingItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = BillItem
        fields = ["id", "product", "product_name", "qty", "price"]


class BillingSerializer(serializers.ModelSerializer):
    items = BillingItemSerializer(many=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), required=True
    )

    class Meta:
        model = Bill
        fields = [
            "id",
            "bill_id",
            "customer",
            "cashier",
            "customer_name",
            "subtotal",
            "tax",
            "discount",
            "total",
            "items",
            "created_at",
        ]
        read_only_fields = ["bill_id", "created_at"]
        depth=1

        
    def create(self, validated_data):
        request = self.context.get("request")  # Get the request from context
        items_data = validated_data.pop("items", [])

        # ✅ Attach the logged-in user as the cashier
        if request and hasattr(request, "user"):
            validated_data["cashier"] = request.user

        billing = Bill.objects.create(**validated_data)

        for item_data in items_data:
            BillItem.objects.create(bill=billing, **item_data)

        return billing

