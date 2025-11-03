from django.urls import path
from . import views

urlpatterns = [
    path("billings/", views.BillList.as_view()),
    path("billings/<int:pk>/", views.BillDetail.as_view()),
    path("billings/<int:pk>/invoice/", views.BillInvoicePDFView.as_view(), name="bill-invoice"),
    path('billings/<int:pk>/mark_paid/', views.mark_bill_paid, name='mark-bill-paid'),  # ✅ new route
]
