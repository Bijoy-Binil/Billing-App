from django.contrib import admin
from .models import Bill, BillItem


class BillItemInline(admin.TabularInline):
    """Inline items for each Bill."""
    model = BillItem
    extra = 1
    readonly_fields = ("price",)
    autocomplete_fields = ("product",)
    fields = ("product", "quantity", "price")


@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    """Admin panel for Bill."""
    list_display = (
        "bill_id",
        "cashier",
        "customer",
        "subtotal",
        "tax",
        "discount",
        "total",
        "payment_status",
        "payment_method",
        "created_at",
    )
    list_filter = ("payment_status", "payment_method", "created_at")
    search_fields = (
        "bill_id",
        "transaction_id",
        "customer__name",
        "cashier__email",
    )  # ✅ required for autocomplete_fields
    readonly_fields = ("bill_id", "created_at", "payment_date", "transaction_id")
    autocomplete_fields = ("cashier", "customer")
    inlines = [BillItemInline]
    ordering = ("-created_at",)
    date_hierarchy = "created_at"

    fieldsets = (
        ("Bill Details", {
            "fields": (
                "bill_id",
                "cashier",
                "customer",
                "subtotal",
                "tax",
                "discount",
                "total",
            )
        }),
        ("Payment Information", {
            "fields": (
                "payment_status",
                "payment_method",
                "transaction_id",
                "payment_date",
            )
        }),
        ("Timestamps", {
            "fields": ("created_at",),
        }),
    )


@admin.register(BillItem)
class BillItemAdmin(admin.ModelAdmin):
    """Admin panel for individual Bill Items."""
    list_display = ("bill", "product", "quantity", "price")
    list_filter = ("product", "bill__payment_status")
    search_fields = ("bill__bill_id", "product__name")  # ✅ required
    autocomplete_fields = ("bill", "product")
    ordering = ("-bill__created_at",)
