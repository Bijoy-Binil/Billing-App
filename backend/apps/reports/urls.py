from django.urls import path
from .views import (
    DailyReportView,
    MonthlyReportView,
)

urlpatterns = [
     path("reports/daily/", DailyReportView.as_view(), name="daily-report"),
    path("reports/monthly/", MonthlyReportView.as_view(), name="monthly-report"),
]
