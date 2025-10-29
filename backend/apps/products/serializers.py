from rest_framework import serializers
from . models import Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"




# apps/stocks/serializers.py
from rest_framework import serializers
from .models import StockEntry
from apps.products.serializers import ProductSerializer
from apps.products.models import Product


class StockEntrySerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        write_only=True, source="product", queryset=Product.objects.all()
    )

    class Meta:
        model = StockEntry
        fields = ("id", "product", "product_id", "quantity_added", "note", "added_by", "created_at")
        read_only_fields = ("added_by", "created_at")

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["added_by"] = user
        return super().create(validated_data)
