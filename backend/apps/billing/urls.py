from django.urls import path
from . import  views
urlpatterns = [
    path('billings/',views.BillList.as_view()),
    path('billing/<int:pk>/',views.BillDetailList.as_view()),
]
