from rest_framework import generics, permissions
from .models import Bill
from .serializers import BillingSerializer
from django.http import HttpResponse, FileResponse
from django.template.loader import render_to_string
from weasyprint import HTML
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status, permissions
from rest_framework.permissions import AllowAny
# apps/billing/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Bill
from rest_framework.views import APIView
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
import io

class BillList(generics.ListCreateAPIView):
    serializer_class = BillingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Bill.objects.all().order_by('-created_at')
        # Filter by recent bills if requested
        recent = self.request.query_params.get('recent', None)
        if recent:
            try:
                limit = int(recent)
                queryset = queryset[:limit]
            except ValueError:
                pass
        return queryset

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

    # Update payment details from request data
    transaction_id = request.data.get('transaction_id')
    payment_method = request.data.get('payment_method', 'paypal')
    
    bill.payment_status = "paid"
    bill.transaction_id = transaction_id
    bill.payment_date = timezone.now()
    bill.payment_method = payment_method
    bill.save()
    return Response({"message": "Bill marked as paid ✅", "bill_id": bill.bill_id})

class BillDetail(generics.RetrieveAPIView):
    queryset = Bill.objects.all()
    serializer_class = BillingSerializer
    permission_classes = [permissions.IsAuthenticated]

class BillInvoicePDFView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, pk):
        try:
            bill = Bill.objects.get(pk=pk)
        except Bill.DoesNotExist:
            return Response({"error": "Bill not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check if bill is paid before allowing invoice download
        if bill.payment_status != 'paid':
            return Response({"error": "Invoice is only available after payment is completed"}, status=status.HTTP_403_FORBIDDEN)

        # Calculate total_price for each item for the template
        for item in bill.items.all():
            item.total_price = item.quantity * item.price

        # Render HTML template with bill data
        html_string = render_to_string('billing/invoice.html', {'bill': bill})
        
        # Generate PDF from HTML using WeasyPrint
        pdf_file = HTML(string=html_string).write_pdf()
        
        # Create HTTP response with PDF
        response = HttpResponse(pdf_file, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{bill.bill_id}.pdf"'
        
        return response

