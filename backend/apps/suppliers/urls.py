from django.urls import path
from . import views

urlpatterns = [
    path('suppliers/', views.SupplierListCreateView.as_view(), name='supplier-list-create'),
    path('suppliers/<int:pk>/', views.SupplierDetailView.as_view(), name='supplier-detail'),
    path('suppliers/autocomplete/', views.supplier_autocomplete, name='supplier-autocomplete'),

    path('purchase-orders/', views.PurchaseOrderListCreateView.as_view(), name='purchaseorder-list-create'),
    path('purchase-orders/<int:pk>/', views.PurchaseOrderDetailView.as_view(), name='purchaseorder-detail'),
]