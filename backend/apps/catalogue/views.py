from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Category, Subcategory, Service,
    ProviderProfession, Banner, Review,
    FAQ, ServiceArea
)
from .serializers import (
    CategorySerializer, SubcategorySerializer, ServiceSerializer,
    ProviderProfessionSerializer, BannerSerializer, ReviewSerializer,
    FAQSerializer, ServiceAreaSerializer
)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["sort_order", "name"]

class SubcategoryViewSet(viewsets.ModelViewSet):
    queryset = Subcategory.objects.filter(active=True)
    serializer_class = SubcategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["category"]
    search_fields = ["name", "description"]

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.filter(active=True).select_related("category", "subcategory")
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "subcategory", "featured"]
    search_fields = ["name", "short_description", "full_description"]
    ordering_fields = ["sort_order", "price", "created_at"]

class ProviderProfessionViewSet(viewsets.ModelViewSet):
    queryset = ProviderProfession.objects.filter(active=True)
    serializer_class = ProviderProfessionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "description"]

class BannerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Banner.objects.filter(active=True)
    serializer_class = BannerSerializer
    permission_classes = [permissions.AllowAny]

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["featured", "service"]

class FAQViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FAQ.objects.filter(active=True)
    serializer_class = FAQSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["category"]

class ServiceAreaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ServiceArea.objects.filter(active=True)
    serializer_class = ServiceAreaSerializer
    permission_classes = [permissions.AllowAny]
