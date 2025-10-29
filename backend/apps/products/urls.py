from django.urls import path
from . import  views
urlpatterns = [
    path('products/',views.ProductList.as_view()),
    path('product/<int:pk>/',views.ProductDetailList.as_view()),
]
