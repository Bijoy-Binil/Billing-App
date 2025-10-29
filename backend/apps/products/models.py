from django.db import models

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