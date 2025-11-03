import uuid
from django.db import models
from django.utils import timezone
from apps.accounts.models import CustomUser
from apps.customers.models import Customer
from apps.products.models import Product
from apps.customers.models import CustomerLoyalty

class Bill(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    ]

    bill_id = models.CharField(max_length=100, unique=True, editable=False)
    cashier = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, related_name="bills"
    )
    customer = models.ForeignKey(
        Customer, on_delete=models.SET_NULL, null=True, blank=True
    )
    subtotal = models.DecimalField(max_digits=30, decimal_places=2)
    tax = models.DecimalField(max_digits=30, decimal_places=2)
    discount = models.DecimalField(max_digits=30, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=30, decimal_places=2)
    payment_status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='pending'
    )
    created_at = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        # ✅ Generate unique bill_id only on creation
        is_new = self._state.adding
        if is_new and not self.bill_id:
            timestamp = timezone.now().strftime("%Y%m%d%H%M%S")
            unique_part = uuid.uuid4().hex[:6].upper()
            self.bill_id = f"BILL-{timestamp}-{unique_part}"

        # ✅ Save Bill first
        super().save(*args, **kwargs)

        # ✅ Update customer loyalty points after save
        if is_new and self.customer:
            loyalty, _ = CustomerLoyalty.objects.get_or_create(customer=self.customer)
            earned_points = int(self.total // 100)  # 1 point per ₹100 spent
            loyalty.available_points += earned_points
            loyalty.lifetime_points += earned_points
            loyalty.update_tier()
            loyalty.save()

    def __str__(self):
        return self.bill_id


class BillItem(models.Model):
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} × {self.quantity}"
