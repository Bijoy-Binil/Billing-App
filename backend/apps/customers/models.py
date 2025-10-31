from django.db import models

# Create your models here.

class Customer(models.Model):
    name = models.CharField(max_length=200)
    contact_number = models.CharField(max_length=20, unique=True)  # ✅ make unique
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.contact_number})"
