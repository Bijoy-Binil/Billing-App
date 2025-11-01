from django.db import models
from apps.billing.models import Bill


class Payment(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("succeeded", "Succeeded"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
    ]

    bill = models.OneToOneField(
        Bill,
        on_delete=models.CASCADE,
        related_name="payment",
        null=True,
        blank=True,
    )
    transaction_id = models.CharField(max_length=255, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Payment {self.transaction_id} ({self.status})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # 🔄 Sync payment status with Bill
        if self.bill:
            if self.status == "succeeded":
                self.bill.payment_status = "paid"
            elif self.status == "failed":
                self.bill.payment_status = "failed"
            else:
                self.bill.payment_status = "pending"
            self.bill.save()
