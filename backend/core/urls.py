from rest_framework.routers import DefaultRouter
from django.urls import path

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .relatorios import (
    RelatorioTombamentoViewSet,
    RelatorioInventarioViewSet
)

from .views import (
    AmbienteViewSet,
    SalaViewSet,
    ItemViewSet,
    TombamentoAnualViewSet,
    ItemTombadoViewSet,
    InventarioViewSet,
    ItemInventariadoViewSet
)

router = DefaultRouter()

# ESTRUTURA
router.register(r"ambientes", AmbienteViewSet)
router.register(r"salas", SalaViewSet)
router.register(r"itens", ItemViewSet)

# TOMBAMENTO (CADASTRO OFICIAL)
router.register(r"tombamentos", TombamentoAnualViewSet)
router.register(r"leituras", ItemTombadoViewSet)

# INVENTÁRIO (VERIFICAÇÃO)
router.register(r"inventarios", InventarioViewSet)
router.register(r"leituras-inventario", ItemInventariadoViewSet)

# RELATÓRIOS
router.register(
    r"relatorios/tombamentos",
    RelatorioTombamentoViewSet,
    basename="relatorios-tombamentos"
)

router.register(
    r"relatorios/inventarios",
    RelatorioInventarioViewSet,
    basename="relatorios-inventarios"
)

urlpatterns = [
    # JWT
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]

urlpatterns += router.urls
