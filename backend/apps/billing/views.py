from rest_framework import generics, permissions
from .models import Bill
from .serializers import BillSerializer


class BillList(generics.ListCreateAPIView):
    """
    GET  /api/bills/         -> list bills (cashier: own bills, manager/admin: all)
    POST /api/bills/         -> create new bill (authenticated users)
    """
    serializer_class = BillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "cashier":
            return Bill.objects.filter(cashier=user).order_by("-created_at")
        return Bill.objects.all().order_by("-created_at")

    def perform_create(self, serializer):
        # Automatically set the cashier to the logged-in user
        serializer.save(cashier=self.request.user)


class BillDetailList(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/bills/<id>/  -> view bill details
    PUT    /api/bills/<id>/  -> update bill (if manager/admin)
    PATCH  /api/bills/<id>/  -> partial update
    DELETE /api/bills/<id>/  -> delete bill (if manager/admin)
    """
    serializer_class = BillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "cashier":
            return Bill.objects.filter(cashier=user).order_by("-created_at")
        return Bill.objects.all().order_by("-created_at")
