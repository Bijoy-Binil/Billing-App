from rest_framework import generics, filters
from .models import Supplier, PurchaseOrder
from .serializers import SupplierSerializer, PurchaseOrderSerializer
from apps.products.models import Product
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework import permissions
from rest_framework import generics, permissions
from django.http import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML
from django.http import HttpResponse, Http404
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status, permissions
# apps/billing/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import PurchaseOrder
from rest_framework.views import APIView

# ---- SUPPLIER VIEWS ----
class SupplierListCreateView(generics.ListCreateAPIView):
    queryset = Supplier.objects.all().order_by('-created_at')
    serializer_class = SupplierSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'contact_person', 'email', 'gst_number']


class SupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer


# ---- PURCHASE ORDER VIEWS ----
class PurchaseOrderListCreateView(generics.ListCreateAPIView):
    queryset = PurchaseOrder.objects.all().order_by('-created_at')
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]  # ✅ add this if using JWT auth
    def perform_create(self, serializer):
        purchase_order = serializer.save()
        product = purchase_order.product
        product.cost_price = purchase_order.cost_price
        product.quantity += purchase_order.quantity
        product.save()


class PurchaseOrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]  # ✅ add this if using JWT auth

# ---- AUTOCOMPLETE (if needed for dropdowns) ----
@api_view(['GET'])
def supplier_autocomplete(request):
    query = request.query_params.get('query', '')
    suppliers = Supplier.objects.filter(name__icontains=query)[:10]
    serializer = SupplierSerializer(suppliers, many=True)
    return Response(serializer.data)

class PurchaseOrderInvoicePDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        purchase_order = get_object_or_404(PurchaseOrder, pk=pk)

        # Render HTML with template
        html_string = render_to_string("purchase_orders/invoice.html", {"purchase_order": purchase_order})

        # Convert HTML to PDF
        pdf_file = HTML(string=html_string).write_pdf()

        # Return PDF response
        response = HttpResponse(pdf_file, content_type="application/pdf")
        response['Content-Disposition'] = f'attachment; filename="invoice_{purchase_order.id}.pdf"'
        return response