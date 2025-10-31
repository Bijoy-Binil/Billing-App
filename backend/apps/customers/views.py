from rest_framework import generics, permissions
from .models import Customer
from .serializers import CustomerSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status

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