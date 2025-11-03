# apps/reports/urls.py

from django.urls import path
from .views import (
    DailyReportView,
    MonthlyReportView,
    MostSoldItemsView,
    ProfitTrackingView,
    StockStatementReportView,
    MarginReportView,
    ManufacturerStockReportView,
    StockBillsReportView,
    PurchaseReportView,
)

urlpatterns = [
    path("reports/daily/", DailyReportView.as_view(), name="daily-report"),
    path("reports/monthly/", MonthlyReportView.as_view(), name="monthly-report"),
    path("reports/most-sold/", MostSoldItemsView.as_view(), name="most-sold-items"),
    path("reports/profit/", ProfitTrackingView.as_view(), name="profit-tracking"),
     path("reports/stock-statement/", StockStatementReportView.as_view(), name="stock-statement"),
    path("reports/margin/", MarginReportView.as_view(), name="margin-report"),
    path("reports/manufacturer/", ManufacturerStockReportView.as_view(), name="manufacturer-stock"),
    path("reports/stock-bills/", StockBillsReportView.as_view(), name="stock-bills-report"),
    path("reports/purchases/", PurchaseReportView.as_view(), name="purchase-report"),
]
