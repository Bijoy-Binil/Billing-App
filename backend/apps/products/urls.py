from django.urls import path
from . import  views
urlpatterns = [
    path('products/',views.ProductList.as_view()),
    path('product/<int:pk>/',views.ProductDetail.as_view()),
    path("products/low-stock/", views.LowStockProductsView.as_view(), name="low-stock-products"),
    path("stocks/", views.StockEntryListCreateView.as_view(), name="stock-entry-list"),
    path("stocks/report/", views.StockReportView.as_view(), name="stock-report"),
]
