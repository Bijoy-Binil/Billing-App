from rest_framework import serializers
from .models import Bill, BillItem
from apps.customers.models import Customer

class BillingItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = BillItem
        fields = ["id", "product", "product_name", "quantity", "price"]

class BillingSerializer(serializers.ModelSerializer):
    items = BillingItemSerializer(many=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all(), required=True)

    class Meta:
        model = Bill
        fields = [
            "id", "bill_id", "customer", "cashier", "customer_name",
            "subtotal", "tax", "discount", "total",
            "items", "created_at"
        ]
        read_only_fields = ["bill_id", "created_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        items_data = validated_data.pop("items", [])
        if request and hasattr(request, "user"):
            validated_data["cashier"] = request.user
        bill = Bill.objects.create(**validated_data)
        for item in items_data:
            BillItem.objects.create(bill=bill, **item)
        return bill
