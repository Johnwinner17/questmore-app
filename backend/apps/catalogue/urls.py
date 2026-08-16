from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, SubcategoryViewSet, ServiceViewSet,
    ProviderProfessionViewSet, BannerViewSet, ReviewViewSet,
    FAQViewSet, ServiceAreaViewSet
)

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("subcategories", SubcategoryViewSet, basename="subcategory")
router.register("services", ServiceViewSet, basename="service")
router.register("professions", ProviderProfessionViewSet, basename="profession")
router.register("banners", BannerViewSet, basename="banner")
router.register("reviews", ReviewViewSet, basename="review")
router.register("faqs", FAQViewSet, basename="faq")
router.register("areas", ServiceAreaViewSet, basename="area")

urlpatterns = [
    path("", include(router.urls)),
]
