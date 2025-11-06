from django.contrib import admin
from .models import Product, Category, StockEntry

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("item_id", "name", "category", "supplier", "price", "quantity", "created_at")
    search_fields = ("name", "item_id", "manufacturer")  # ✅ required
