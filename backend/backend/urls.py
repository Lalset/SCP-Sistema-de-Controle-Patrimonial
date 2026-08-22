from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    # AUTH
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # API PRINCIPAL
    path("api/", include("core.urls")),

    # Login da API navegável do DRF (caixa de usuário/senha)
    path("api-auth/", include("rest_framework.urls")),
]
