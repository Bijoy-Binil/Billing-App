from rest_framework import serializers
from .models import Supplier, PurchaseOrder
from apps.products.serializers import ProductSerializer
from apps.products.models import Product

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = '__all__'
        read_only_fields = ("total", "created_at","purchase_id")     
    def create(self, validated_data):
        # Calculate total automatically
        validated_data['total'] = validated_data['quantity'] * validated_data['cost_price']
        return super().create(validated_data)