from rest_framework import serializers
from django.db import transaction
from .models import Bill, BillItem
from apps.customers.models import Customer
from apps.products.models import Product


class BillingItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = BillItem
        fields = ["id", "product", "product_name", "quantity", "price"]
        depth=1

class BillingSerializer(serializers.ModelSerializer):
    items = BillingItemSerializer(many=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), required=True
    )

    class Meta:
        model = Bill
        fields = [
            "id", "bill_id", "customer", "cashier", "customer_name",
            "subtotal", "tax", "discount", "total",
            "items", "created_at"
        ]
        read_only_fields = ["bill_id", "created_at"]
        depth=1
    @transaction.atomic  # ✅ ensures rollback if anything fails
    def create(self, validated_data):
        request = self.context.get("request")
        items_data = validated_data.pop("items", [])

        # Attach cashier if available
        if request and hasattr(request, "user"):
            validated_data["cashier"] = request.user

        bill = Bill.objects.create(**validated_data)

        # Process all bill items
        for item_data in items_data:
            product_id = item_data.get("product")
            quantity = item_data.get("quantity", 0)
            price = item_data.get("price", 0)

            # Fetch actual product object safely
            product = (
                product_id
                if isinstance(product_id, Product)
                else Product.objects.filter(id=product_id).first()
            )

            if not product:
                raise serializers.ValidationError(
                    {"product": f"Product with id {product_id} not found."}
                )

            # ✅ Create the BillItem
            BillItem.objects.create(
                bill=bill,
                product=product,
                quantity=quantity,
                price=price,
            )

            # ✅ Update stock or quantity safely
            if hasattr(product, "stock"):
                current_stock = int(product.stock or 0)
                product.stock = max(0, current_stock - quantity)
            elif hasattr(product, "quantity"):
                current_qty = int(product.quantity or 0)
                product.quantity = max(0, current_qty - quantity)

            product.save(update_fields=["stock" if hasattr(product, "stock") else "quantity"])

        return bill
