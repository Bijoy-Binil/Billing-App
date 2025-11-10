from django.contrib import admin
from django.urls import path,include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include("apps.accounts.urls")),
    path('api/', include("apps.billing.urls")),
    path('api/', include("apps.customers.urls")),
    path('api/', include("apps.payment.urls")),
    path('api/', include("apps.products.urls")),
    path('api/', include("apps.reports.urls")),
    path('api/', include("apps.suppliers.urls")),
    path('api-auth/', include('rest_framework.urls')),

    path("i18n/", include("django.conf.urls.i18n")),


    
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
