from django.contrib import admin
from . models import Supplier,PurchaseOrder
# Register your models here.
admin.site.register(Supplier)
admin.site.register(PurchaseOrder)
