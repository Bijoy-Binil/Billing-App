from django.shortcuts import render

# Create your views here.
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Product
from .serializers import ProductSerializer
from .permissions import IsManagerOrReadOnly


class ProductList(generics.ListCreateAPIView):
    queryset = Product.objects.all().order_by("-created_at")
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrReadOnly]


class ProductDetailList(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrReadOnly]


class LowStockProductsView(APIView):
    """
    GET /api/products/low-stock/?threshold=5
    Returns products whose quantity <= threshold (default = 5)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        threshold_str = request.query_params.get("threshold", "5")
        try:
            threshold = int(threshold_str)
        except ValueError:
            threshold = 5

        products = Product.objects.filter(quantity__lte=threshold).order_by("quantity")
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
