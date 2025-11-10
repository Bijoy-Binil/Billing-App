from django.db import models
from decimal import Decimal
from django.utils import timezone
from django.db.models import Max
from apps.accounts.models import CustomUser
# Create your models here.

# apps/products/models.py

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Categories'

    def __str__(self) -> str:
        return self.name


class Product(models.Model):
    item_id = models.CharField(max_length=50, unique=True, editable=False)
    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    supplier = models.ForeignKey("suppliers.Supplier", on_delete=models.SET_NULL, null=True, blank=True)
    manufacturer = models.CharField(max_length=100, blank=True)
    quantity = models.IntegerField(default=0)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='products/%Y/%m/%d/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Only generate a new ID if it doesn’t exist already
        if not self.item_id:
            last_item = Product.objects.aggregate(max_id=Max("id"))["max_id"] or 0
            new_id = last_item + 1
            self.item_id = f"P-{new_id:04d}"  # Example: P-0001, P-0002, etc.
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.item_id} - {self.name}"


class StockEntry(models.Model):
    """
    Represents a manual stock addition (e.g., new purchase or restock)
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="stock_entries")
    quantity_added = models.IntegerField()
    note = models.CharField(max_length=255, blank=True)
    added_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(default=timezone.now())

    def save(self, *args, **kwargs):
        # When a stock entry is created, update the product quantity
        if not self.pk:  # only when creating (not updating)
            self.product.quantity += self.quantity_added
            self.product.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} +{self.quantity_added} units"