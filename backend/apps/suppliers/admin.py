from django.contrib import admin
from .models import Supplier, PurchaseOrder


class PurchaseOrderInline(admin.TabularInline):
    """Inline view for Purchase Orders inside Supplier admin."""
    model = PurchaseOrder
    extra = 1
    readonly_fields = ("purchase_id", "total", "created_at")
    autocomplete_fields = ("product",)
    fields = ("product", "quantity", "cost_price", "total", "created_at")


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    """Admin configuration for Supplier model."""
    list_display = ("name", "contact_person", "phone", "email", "gst_number", "created_at")
    search_fields = ("name", "contact_person", "phone", "email", "gst_number")  # ✅ for autocomplete support
    ordering = ("name",)
    readonly_fields = ("created_at",)
    inlines = [PurchaseOrderInline]
    fieldsets = (
        ("Supplier Info", {
            "fields": ("name", "contact_person", "phone", "email", "address", "gst_number"),
        }),
        ("Timestamps", {
            "fields": ("created_at",),
        }),
    )


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    """Admin configuration for Purchase Order model."""
    list_display = ("purchase_id", "supplier", "product", "quantity", "cost_price", "total", "created_at")
    list_filter = ("supplier", "created_at")
    search_fields = ("purchase_id", "supplier__name", "product__name")  # ✅ required for autocomplete
    autocomplete_fields = ("supplier", "product")
    readonly_fields = ("purchase_id", "total", "created_at")
    ordering = ("-created_at",)

    fieldsets = (
        ("Purchase Order Details", {
            "fields": (
                "purchase_id",
                "supplier",
                "product",
                "quantity",
                "cost_price",
                "total",
            ),
        }),
        ("Timestamps", {
            "fields": ("created_at",),
        }),
    )
