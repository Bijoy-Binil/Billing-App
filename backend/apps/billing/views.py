from rest_framework import generics, permissions
from .models import Bill
from .serializers import BillingSerializer
from django.http import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML
from rest_framework.views import APIView
from .models import Bill
from rest_framework import permissions

class BillList(generics.ListCreateAPIView):
    queryset = Bill.objects.all().order_by('-created_at')
    serializer_class = BillingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

class BillDetail(generics.RetrieveAPIView):
    queryset = Bill.objects.all()
    serializer_class = BillingSerializer
    permission_classes = [permissions.IsAuthenticated]


class BillInvoicePDFView(APIView):
    permission_classes = []

    def get(self, request, pk: int):
        bill = Bill.objects.prefetch_related("items__product", "customer").get(pk=pk)
        html = render_to_string("billing/invoice.html", {"bill": bill})
        pdf = HTML(string=html, base_url=request.build_absolute_uri()).write_pdf()

        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="invoice_{bill.bill_id}.pdf"'
        return response
