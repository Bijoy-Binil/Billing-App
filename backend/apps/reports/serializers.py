# apps/reports/serializers.py

from rest_framework import serializers

class DailyReportSerializer(serializers.Serializer):
    date = serializers.DateField()
    total_sales = serializers.DecimalField(max_digits=12, decimal_places=2)
    bill_count = serializers.IntegerField()

class MonthlyReportSerializer(serializers.Serializer):
    month = serializers.CharField()
    total_sales = serializers.DecimalField(max_digits=12, decimal_places=2)
    bill_count = serializers.IntegerField()

class MostSoldItemSerializer(serializers.Serializer):
    product = serializers.CharField()
    total_qty = serializers.IntegerField()
    total_sales = serializers.DecimalField(max_digits=12, decimal_places=2)

class ProfitReportSerializer(serializers.Serializer):
    product = serializers.CharField()
    cost_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    selling_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_qty_sold = serializers.IntegerField()
    total_profit = serializers.DecimalField(max_digits=12, decimal_places=2)

class StockStatementSerializer(serializers.Serializer):
    product = serializers.CharField()
    opening_stock = serializers.IntegerField()
    closing_stock = serializers.IntegerField()
    total_sold = serializers.IntegerField()

class MarginReportSerializer(serializers.Serializer):
    product = serializers.CharField()
    margin_percent = serializers.DecimalField(max_digits=5, decimal_places=2)

class ManufacturerStockSerializer(serializers.Serializer):
    manufacturer = serializers.CharField()
    total_products = serializers.IntegerField()
    total_stock_value = serializers.DecimalField(max_digits=12, decimal_places=2)
