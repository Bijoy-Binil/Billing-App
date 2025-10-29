from django.urls import path
from . import  views
urlpatterns = [
    path('billings/',views.BillList.as_view()),
    path('billing/<int:pk>/',views.BillDetail.as_view()),
    path("billing/<int:pk>/invoice/", views.BillInvoicePDFView.as_view(), name="bill-invoice"),
]
