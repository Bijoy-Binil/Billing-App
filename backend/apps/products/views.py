from rest_framework import generics, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Product,StockEntry,Category
from .serializers import ProductSerializer,StockEntrySerializer,CategorySerializer
from django.db.models import Sum, F
from .permissions import IsManagerOrReadOnly


class CategoryList(generics.ListCreateAPIView):
    """
    GET  /api/products/        -> list all (search/order supported)
    POST /api/products/        -> add new product (manager only)
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrReadOnly]

class ProductList(generics.ListCreateAPIView):
    """
    GET  /api/products/        -> list all (search/order supported)
    POST /api/products/        -> add new product (manager only)
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrReadOnly]

    # enable search and ordering
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "item_id", "category__name", "manufacturer"]
    ordering_fields = ["price", "quantity", "created_at"]


class ProductDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/products/<id>/ -> get product details
    PUT    /api/products/<id>/ -> update product (manager only)
    DELETE /api/products/<id>/ -> delete product (manager only)
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrReadOnly]


class LowStockProductsView(APIView):
    """
    GET /api/products/low-stock/?threshold=5
    Returns products whose quantity <= threshold (default = 5)
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        threshold_str = request.query_params.get("threshold", "20")
        try:
            threshold = int(threshold_str)
        except ValueError:
            threshold = 20

        products = Product.objects.filter(quantity__lte=threshold).order_by("quantity")
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)


class StockEntryListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/stocks/      -> list all stock entries
    POST /api/stocks/      -> add stock (manager only)
    """
    queryset = StockEntry.objects.all().select_related("product", "added_by").order_by("-created_at")
    serializer_class = StockEntrySerializer
    permission_classes = [permissions.AllowAny, IsManagerOrReadOnly]


class StockReportView(APIView):
    """
    GET /api/stocks/report/
    Shows total products, total stock quantity, and total inventory value.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        products = Product.objects.all().annotate(total_value=F("quantity") * F("price"))

        data = {
            "total_products": products.count(),
            "total_quantity": products.aggregate(Sum("quantity"))["quantity__sum"] or 0,
            "total_value": products.aggregate(Sum("total_value"))["total_value__sum"] or 0,
            "products": [
                {
                    "item_id": p.item_id,
                    "name": p.name,
                    "category": p.category,
                    "quantity": p.quantity,
                    "price": float(p.price),
                    "total_value": float(p.quantity * p.price),
                }
                for p in products
            ],
        }
        return Response(data)