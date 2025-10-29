# apps/reports/views.py

from datetime import date
from django.db.models import Sum, F, Count
from django.db.models.functions import TruncDate, TruncMonth
from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.billing.models import Bill, BillItem
from apps.products.models import Product
from .serializers import (
    DailyReportSerializer,
    MonthlyReportSerializer,
    MostSoldItemSerializer,
    ProfitReportSerializer,
    StockStatementSerializer,
    MarginReportSerializer,
    ManufacturerStockSerializer,
)

# ✅ Daily Report
class DailyReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        start_date = request.query_params.get("start_date", date.today().replace(day=1))
        end_date = request.query_params.get("end_date", date.today())

        qs = (
            Bill.objects.filter(created_at__date__range=[start_date, end_date])
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(total_sales=Sum("total"), bill_count=Count("id"))
            .order_by("date")
        )

        serializer = DailyReportSerializer(qs, many=True)
        return Response(serializer.data)


# ✅ Monthly Report
class MonthlyReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        year = request.query_params.get("year", date.today().year)

        qs = (
            Bill.objects.filter(created_at__year=year)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(total_sales=Sum("total"), bill_count=Count("id"))
            .order_by("month")
        )

        formatted = [
            {
                "month": item["month"].strftime("%Y-%m"),
                "total_sales": item["total_sales"],
                "bill_count": item["bill_count"],
            }
            for item in qs
        ]
        serializer = MonthlyReportSerializer(formatted, many=True)
        return Response(serializer.data)


# ✅ Most Sold Items Report
class MostSoldItemsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = (
            BillItem.objects.values("product__name")
            .annotate(
                total_qty=Sum("qty"),
                total_sales=Sum(F("qty") * F("price")),
            )
            .order_by("-total_qty")[:10]
        )
        serializer = MostSoldItemSerializer(
            [{"product": q["product__name"], "total_qty": q["total_qty"], "total_sales": q["total_sales"]} for q in qs],
            many=True,
        )
        return Response(serializer.data)


# ✅ Profit Tracking Report
class ProfitTrackingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = (
            BillItem.objects.values("product__name", "product__cost_price", "price")
            .annotate(total_qty_sold=Sum("qty"))
        )
        data = []
        for item in qs:
            total_profit = (item["price"] - item["product__cost_price"]) * item["total_qty_sold"]
            data.append({
                "product": item["product__name"],
                "cost_price": item["product__cost_price"],
                "selling_price": item["price"],
                "total_qty_sold": item["total_qty_sold"],
                "total_profit": total_profit,
            })
        serializer = ProfitReportSerializer(data, many=True)
        return Response(serializer.data)


# ✅ Stock Statement Report
class StockStatementReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = []
        for p in Product.objects.all():
            total_sold = BillItem.objects.filter(product=p).aggregate(Sum("qty"))["qty__sum"] or 0
            opening_stock = p.quantity + total_sold
            closing_stock = p.quantity
            data.append({
                "product": p.name,
                "opening_stock": opening_stock,
                "closing_stock": closing_stock,
                "total_sold": total_sold,
            })
        serializer = StockStatementSerializer(data, many=True)
        return Response(serializer.data)


# ✅ Margin Report
class MarginReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = []
        for p in Product.objects.all():
            if p.cost_price > 0:
                margin_percent = ((p.price - p.cost_price) / p.cost_price) * 100
                data.append({"product": p.name, "margin_percent": round(margin_percent, 2)})
        serializer = MarginReportSerializer(data, many=True)
        return Response(serializer.data)


# ✅ Stock Manufacturer Report
class ManufacturerStockReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = (
            Product.objects.values("manufacturer")
            .annotate(
                total_products=Count("id"),
                total_stock_value=Sum(F("quantity") * F("price")),
            )
            .order_by("manufacturer")
        )
        serializer = ManufacturerStockSerializer(qs, many=True)
        return Response(serializer.data)
