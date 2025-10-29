from django.urls import path
from . import  views
urlpatterns = [
    path('billing/',views.BillList.as_view()),
    path('customer/<int:pk>/',views.BillDetailList.as_view()),
]
