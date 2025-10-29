from rest_framework import generics, permissions
from .models import Customer
from .serializers import CustomerSerializer


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
