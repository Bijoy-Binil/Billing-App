from datetime import date
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate, TruncMonth
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.billing.models import Bill
from .serializers import DailyReportSerializer, MonthlyReportSerializer


class DailyReportView(APIView):
    """
    GET /api/reports/daily/?start_date=2025-10-01&end_date=2025-10-29
    Returns total sales and bill count per day
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date", date.today())

        # fallback: default to current month
        if not start_date:
            start_date = date.today().replace(day=1)

        qs = (
            Bill.objects.filter(created_at__date__range=[start_date, end_date])
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(total_sales=Sum("total_amount"), bill_count=Count("id"))
            .order_by("date")
        )

        serializer = DailyReportSerializer(qs, many=True)
        return Response(serializer.data)


class MonthlyReportView(APIView):
    """
    GET /api/reports/monthly/?year=2025
    Returns total sales and bill count per month for the given year
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        year = request.query_params.get("year", date.today().year)

        qs = (
            Bill.objects.filter(created_at__year=year)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(total_sales=Sum("total_amount"), bill_count=Count("id"))
            .order_by("month")
        )

        # format month as "YYYY-MM"
        formatted_qs = [
            {
                "month": item["month"].strftime("%Y-%m"),
                "total_sales": item["total_sales"],
                "bill_count": item["bill_count"],
            }
            for item in qs
        ]

        serializer = MonthlyReportSerializer(formatted_qs, many=True)
        return Response(serializer.data)
