from rest_framework import serializers
from . models import Bill,BillItem
from apps.products.serializers import ProductSerializer
from apps.products.models import Product
from datetime import timezone



class BillItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(write_only=True, source="product", queryset=Product.objects.all())

    class Meta:
        model = BillItem
        fields = ("id", "product", "product_id", "qty", "price")


class BillSerializer(serializers.ModelSerializer):
    items = BillItemSerializer(many=True)

    class Meta:
        model = Bill
        fields = ("id", "bill_id", "cashier", "customer", "subtotal", "tax", "discount", "total", "items", "created_at")
        read_only_fields = ("cashier", "bill_id", "created_at")

    def create(self, validated_data) -> Bill:
        items_data = validated_data.pop("items")
        request = self.context["request"]
        user = request.user
        # generate unique bill id (timestamp + user id)
        bill_id = f"BILL-{int(timezone.now().timestamp())}-{user.id}"
        bill = Bill.objects.create(bill_id=bill_id, cashier=user, **validated_data)
        for item in items_data:
            product = item["product"]
            qty = item["qty"]
            price = item["price"]
            BillItem.objects.create(bill=bill, product=product, qty=qty, price=price)
            # update stock
            product.quantity = product.quantity - qty
            product.save()
        return bill

