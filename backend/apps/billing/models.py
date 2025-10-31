import uuid
from django.db import models
from django.utils import timezone
from apps.accounts.models import CustomUser
from apps.customers.models import Customer
from apps.products.models import Product


class Bill(models.Model):
    bill_id = models.CharField(max_length=100, unique=True, editable=False)
    cashier = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, related_name="bills"
    )
    customer = models.ForeignKey(
        Customer, on_delete=models.SET_NULL, null=True, blank=True
    )
    subtotal = models.DecimalField(max_digits=30, decimal_places=2)  # Increased
    tax = models.DecimalField(max_digits=30, decimal_places=2)       # Increased
    discount = models.DecimalField(max_digits=30, decimal_places=2, default=0)  # Increased
    total = models.DecimalField(max_digits=30, decimal_places=2)     # Increased
    created_at = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        # Generate unique bill_id if not already set
        if not self.bill_id:
            timestamp = timezone.now().strftime("%Y%m%d%H%M%S")
            unique_part = uuid.uuid4().hex[:6].upper()
            self.bill_id = f"BILL-{timestamp}-{unique_part}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.bill_id


class BillItem(models.Model):
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)  # Increased for safety

    def __str__(self):
        return f"{self.product.name} × {self.quantity}"