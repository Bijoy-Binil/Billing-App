from rest_framework import serializers


class DailyReportSerializer(serializers.Serializer):
    date = serializers.DateField()
    total_sales = serializers.DecimalField(max_digits=10, decimal_places=2)
    bill_count = serializers.IntegerField()


class MonthlyReportSerializer(serializers.Serializer):
    month = serializers.CharField()
    total_sales = serializers.DecimalField(max_digits=10, decimal_places=2)
    bill_count = serializers.IntegerField()
