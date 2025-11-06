from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin panel configuration for Payment model."""
    list_display = (
        "transaction_id",
        "bill",
        "amount",
        "status",
        "created_at",
        "updated_at",
    )
    list_filter = ("status", "created_at")
    search_fields = (
        "transaction_id",
        "bill__bill_id",
        "bill__customer__name",
        "bill__cashier__email",
    )  # ✅ Required for autocomplete_fields
    autocomplete_fields = ("bill",)
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)
    date_hierarchy = "created_at"

    fieldsets = (
        ("Payment Details", {
            "fields": (
                "transaction_id",
                "bill",
                "amount",
                "status",
            )
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
        }),
    )

    def bill_status(self, obj):
        """Display linked Bill's payment status (for quick reference)."""
        return obj.bill.payment_status if obj.bill else "-"
    bill_status.short_description = "Bill Payment Status"
