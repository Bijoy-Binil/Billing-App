from django.db import models
import uuid
from django.utils import timezone

class Supplier(models.Model):
    name = models.CharField(max_length=200, unique=True)
    contact_person = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    gst_number = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class PurchaseOrder(models.Model):
    purchase_id = models.CharField(max_length=100, unique=True, editable=False,null=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchase_orders')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='purchase_orders')
    quantity = models.IntegerField(default=1)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Calculate total
        self.total = self.quantity * self.cost_price

        # Generate unique purchase_id only on creation
        if not self.purchase_id:
            timestamp = timezone.now().strftime("%Y%m%d%H%M%S")
            unique_part = uuid.uuid4().hex[:6].upper()
            self.purchase_id = f"PO-{timestamp}-{unique_part}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.purchase_id} - {self.supplier.name} - {self.product.name}"