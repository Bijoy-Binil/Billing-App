# payments/urls.py
from django.urls import path
from .views import PaymentListCreateView, link_bill

urlpatterns = [
    path("payments/", PaymentListCreateView.as_view(), name="payments"),
    path("payments/<str:transaction_id>/link_bill/", link_bill, name="link-bill"),
]
