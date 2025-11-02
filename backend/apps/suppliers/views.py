from rest_framework import generics, filters
from .models import Supplier, PurchaseOrder
from .serializers import SupplierSerializer, PurchaseOrderSerializer
from apps.products.models import Product
from rest_framework.response import Response
from rest_framework.decorators import api_view

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

    def perform_create(self, serializer):
        purchase_order = serializer.save()
        product = purchase_order.product
        product.cost_price = purchase_order.cost_price
        product.quantity += purchase_order.quantity
        product.save()


class PurchaseOrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer


# ---- AUTOCOMPLETE (if needed for dropdowns) ----
@api_view(['GET'])
def supplier_autocomplete(request):
    query = request.query_params.get('query', '')
    suppliers = Supplier.objects.filter(name__icontains=query)[:10]
    serializer = SupplierSerializer(suppliers, many=True)
    return Response(serializer.data)
