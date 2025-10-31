from django.urls import path
from . import  views
urlpatterns = [
    path('customers/',views.CustomerList.as_view()),
    path('customer/<int:pk>/',views.CustomerDetailList.as_view()),
    path('customers/search/', views.search_customer),  # ✅ new endpoint
]
