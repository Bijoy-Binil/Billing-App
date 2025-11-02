from django.db import models

# Create your models here.

# class Customer(models.Model):
#     name = models.CharField(max_length=200)
#     contact_number = models.CharField(max_length=20, unique=True)  # ✅ make unique
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"{self.name} ({self.contact_number})"

class Customer(models.Model):
    name = models.CharField(max_length=200)
    contact_number = models.CharField(max_length=20, unique=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.contact_number})"
    

class CustomerLoyalty(models.Model):
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name="loyalty")
    tier = models.CharField(max_length=20, default="bronze")
    available_points = models.PositiveIntegerField(default=0)
    lifetime_points = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.customer.name} - {self.tier}"

    def update_tier(self):
        """Auto upgrade tier based on lifetime points."""
        if self.lifetime_points >= 10000:
            self.tier = "platinum"
        elif self.lifetime_points >= 5000:
            self.tier = "gold"
        elif self.lifetime_points >= 1000:
            self.tier = "silver"
        else:
            self.tier = "bronze"
        self.save()
