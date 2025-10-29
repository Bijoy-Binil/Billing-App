from rest_framework import serializers
from .models import Bill, BillItem
from apps.products.serializers import ProductSerializer
from apps.products.models import Product


class BillItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        write_only=True, source="product", queryset=Product.objects.all()
    )

    class Meta:
        model = BillItem
        fields = ("id", "product", "product_id", "qty", "price")


class BillSerializer(serializers.ModelSerializer):
    items = BillItemSerializer(many=True)

    class Meta:
        model = Bill
        fields = (
            "id",
            "bill_id",
            "cashier",
            "customer",
            "subtotal",
            "tax",
            "discount",
            "total",
            "items",
            "created_at",
        )
        read_only_fields = ("cashier", "bill_id", "created_at")

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        request = self.context["request"]
        user = request.user

        # Create the bill — unique bill_id auto generated in model.save()
        bill = Bill.objects.create(cashier=user, **validated_data)

        for item_data in items_data:
            product = item_data["product"]
            qty = item_data["qty"]
            price = item_data["price"]

            # Create BillItem entry
            BillItem.objects.create(bill=bill, product=product, qty=qty, price=price)

            # Update product stock safely
            if product.quantity < qty:
                raise serializers.ValidationError(
                    f"Not enough stock for {product.name} (Available: {product.quantity})"
                )
            product.quantity -= qty
            product.save()

        return bill
