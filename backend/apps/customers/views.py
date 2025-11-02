from rest_framework import generics, permissions
from .models import Customer,CustomerLoyalty
from .serializers import CustomerSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Sum, Avg, Count
from django.db.models.signals import post_save
from apps.billing.models import  Bill,BillItem
from .serializers import (
    CustomerSerializer,
    CustomerLoyaltySerializer,
)
from django.dispatch import receiver
class CustomerList(generics.ListCreateAPIView):
    """
    GET  /api/customers/        -> list all customers
    POST /api/customers/        -> create new customer
    """
    queryset = Customer.objects.all().order_by("-created_at")
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]


class CustomerDetailList(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/customers/<id>/ -> get customer details
    PUT    /api/customers/<id>/ -> update customer
    PATCH  /api/customers/<id>/ -> partial update
    DELETE /api/customers/<id>/ -> delete customer
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def search_customer(request):
    contact = request.query_params.get("contact")
    if not contact:
        return Response({"error": "Contact number is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        customer = Customer.objects.get(contact_number=contact)
        serializer = CustomerSerializer(customer)
        return Response(serializer.data)
    except Customer.DoesNotExist:
        return Response({"detail": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)
    
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def search_customer(request):
    contact = request.query_params.get("contact")
    if not contact:
        return Response({"error": "Contact number is required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        customer = Customer.objects.get(contact_number=contact)
        serializer = CustomerSerializer(customer)
        return Response(serializer.data)
    except Customer.DoesNotExist:
        return Response({"detail": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)


# ✅ Loyalty Program API
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def customer_loyalty(request, pk):
    try:
        loyalty, _ = CustomerLoyalty.objects.get_or_create(customer_id=pk)
        loyalty.update_tier()
        serializer = CustomerLoyaltySerializer(loyalty)
        return Response(serializer.data)
    except Customer.DoesNotExist:
        return Response({"error": "Customer not found"}, status=404)


# ✅ Purchase History & Analytics API
# views.py
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def customer_purchase_history(request, pk):
    from django.db.models import Sum, Avg, Count

    try:
        bills = (
            Bill.objects.filter(customer_id=pk)
            .select_related("customer")
            .prefetch_related("items")
        )

        total_spent = bills.aggregate(total_spent=Sum("total"))["total_spent"] or 0
        total_bills = bills.count()
        avg_bill_value = bills.aggregate(avg=Avg("total"))["avg"] or 0

        # ✅ Convert Decimal to float for frontend
        total_spent = float(total_spent)
        avg_bill_value = float(avg_bill_value)

        # ✅ Recent purchases
        recent_purchases = [
            {
                "bill_id": bill.bill_id,
                "date": bill.created_at,
                "items_count": bill.items.count(),
                "total": float(bill.total),
                "payment_status": bill.payment_status,
            }
            for bill in bills.order_by("-created_at")[:5]
        ]

        # ✅ Frequent products
        frequent_products = (
            BillItem.objects.filter(bill__customer_id=pk)
            .values("product__name")
            .annotate(count=Count("id"), total_quantity=Sum("quantity"))
            .order_by("-count")[:5]
        )

        return Response(
            {
                "total_spent": total_spent,
                "total_bills": total_bills,
                "average_bill_value": avg_bill_value,
                "recent_purchases": recent_purchases,
                "frequent_products": list(frequent_products),
            }
        )

    except Customer.DoesNotExist:
        return Response({"error": "Customer not found"}, status=404)



    
@receiver(post_save, sender=Customer)
def create_loyalty_for_customer(sender, instance, created, **kwargs):
    if created:
        CustomerLoyalty.objects.create(customer=instance)
    else:
        # ensure loyalty exists even if missing
        CustomerLoyalty.objects.get_or_create(customer=instance)



@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def search_customer(request):
    contact = request.query_params.get("contact")
    if not contact:
        return Response({"error": "Contact number required"}, status=400)
    customer = Customer.objects.filter(contact_number=contact).first()
    if not customer:
        return Response({"detail": "Customer not found"}, status=404)
    return Response(CustomerSerializer(customer).data)
