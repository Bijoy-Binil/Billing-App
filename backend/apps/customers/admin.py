from django.contrib import admin
from .models import Customer, CustomerLoyalty

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("name", "contact_number", "email", "created_at")
    search_fields = ("name", "contact_number", "email")  # ✅ required

@admin.register(CustomerLoyalty)
class CustomerLoyaltyAdmin(admin.ModelAdmin):
    list_display = ("customer", "tier", "available_points", "lifetime_points", "updated_at")
    search_fields = ("customer__name",)
