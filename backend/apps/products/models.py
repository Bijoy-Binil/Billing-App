from django.db import models
from decimal import Decimal
from datetime import timezone
from apps.accounts.models import CustomUser
# Create your models here.

class Product(models.Model):
    item_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)
    quantity = models.IntegerField(default=0)  # stock quantity
    price = models.DecimalField(max_digits=10, decimal_places=2)  # per unit
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.item_id} - {self.name}"
    

class StockEntry(models.Model):
    """
    Represents a manual stock addition (e.g., new purchase or restock)
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="stock_entries")
    quantity_added = models.IntegerField()
    note = models.CharField(max_length=255, blank=True)
    added_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(default=timezone)

    def save(self, *args, **kwargs):
        # When a stock entry is created, update the product quantity
        if not self.pk:  # only when creating (not updating)
            self.product.quantity += self.quantity_added
            self.product.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} +{self.quantity_added} units"