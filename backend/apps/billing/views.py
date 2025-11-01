from rest_framework import generics, permissions
from .models import Bill
from .serializers import BillingSerializer
from django.http import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status, permissions
# apps/billing/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Bill
from rest_framework.views import APIView

class BillList(generics.ListCreateAPIView):
    queryset = Bill.objects.all().order_by('-created_at')
    serializer_class = BillingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request

        return context
@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated])
def mark_bill_paid(request, pk: int):
    try:
        bill = Bill.objects.get(pk=pk)
    except Bill.DoesNotExist:
        return Response({"error": "Bill not found"}, status=status.HTTP_404_NOT_FOUND)

    bill.payment_status = "paid"
    bill.save()
    return Response({"message": "Bill marked as paid ✅"})
class BillDetail(generics.RetrieveAPIView):
    queryset = Bill.objects.all()
    serializer_class = BillingSerializer
    permission_classes = [permissions.IsAuthenticated]

class BillInvoicePDFView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        bill = Bill.objects.prefetch_related("items__product", "customer").get(pk=pk)
        html = render_to_string("billing/invoice.html", {"bill": bill})
        pdf = HTML(string=html, base_url=request.build_absolute_uri()).write_pdf()
        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="invoice_{bill.bill_id}.pdf"'
        return response
