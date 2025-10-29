from django.db import models
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from typing import Any
from apps.accounts.models import CustomUser
from apps.customers.models import Customer
from apps.products.models import Product


# Create your models here.
class Bill(models.Model):
    bill_id = models.CharField(max_length=100, unique=True)
    cashier = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name="bills")
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(default=timezone.now)


class BillItem(models.Model):
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    qty = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # price at time of sale