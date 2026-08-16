from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CartView, ServiceRequestViewSet

router = DefaultRouter()
router.register("requests", ServiceRequestViewSet, basename="service-request")

urlpatterns = [
    path("cart/", CartView.as_view(), name="cart"),
    path("", include(router.urls)),
]
