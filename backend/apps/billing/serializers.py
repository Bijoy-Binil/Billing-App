from rest_framework import serializers
from django.db import transaction
from .models import Bill, BillItem
from apps.customers.models import Customer
from apps.products.models import Product


class BillingItemSerializer(serializers.ModelSerializer):
    # Ensure we always receive a valid Product PK on write
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = BillItem
        fields = ["id", "product", "product_name", "quantity", "price"]
        depth = 1

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
            "subtotal", "tax", "discount", "total","payment_status",
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
            # With PrimaryKeyRelatedField above, DRF will pass Product instance here
            product_value = item_data.get("product")
            quantity = item_data.get("quantity", 0)
            price = item_data.get("price", 0)

            # Resolve product instance robustly
            if isinstance(product_value, Product):
                product = product_value
            elif product_value is not None:
                product = Product.objects.filter(id=product_value).first()
            else:
                product = None

            if product is None:
                raise serializers.ValidationError({"product": "Product is required for each item and must be valid."})

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
                product.stock = max(0, current_stock - int(quantity))
                product.save(update_fields=["stock"])
            elif hasattr(product, "quantity"):
                current_qty = int(product.quantity or 0)
                product.quantity = max(0, current_qty - int(quantity))
                product.save(update_fields=["quantity"])

        return bill
