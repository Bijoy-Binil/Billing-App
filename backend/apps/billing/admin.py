from django.contrib import admin
from . models import Bill,BillItem
# Register your models here.
admin.site.register(Bill)
admin.site.register(BillItem)