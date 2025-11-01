# apps/payments/views.py
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Payment
from .serializers import PaymentSerializer
from apps.billing.models import Bill

class PaymentListCreateView(generics.ListCreateAPIView):
    queryset = Payment.objects.all().order_by("-created_at")
    serializer_class = PaymentSerializer


@api_view(["PATCH"])
def link_bill(request, transaction_id):
    """Link a Payment (by transaction_id) to a Bill"""
    try:
        payment = Payment.objects.get(transaction_id=transaction_id)
    except Payment.DoesNotExist:
        return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

    bill_id = request.data.get("bill_id")
    if not bill_id:
        return Response({"error": "bill_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        bill = Bill.objects.get(id=bill_id)
    except Bill.DoesNotExist:
        return Response({"error": "Bill not found"}, status=status.HTTP_404_NOT_FOUND)

    payment.bill = bill
    payment.save()

    return Response({"message": "Bill linked successfully ✅"})
