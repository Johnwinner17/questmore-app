from rest_framework import serializers
from .models import (
    Category, Subcategory, Service,
    ProviderProfession, Banner, Review,
    FAQ, ServiceArea
)

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "icon", "image_url", "sort_order", "active"]

class SubcategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Subcategory
        fields = ["id", "category", "category_name", "name", "slug", "description", "icon", "image_url", "sort_order", "active"]

class ServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_icon = serializers.CharField(source="category.icon", read_only=True)
    subcategory_name = serializers.CharField(source="subcategory.name", read_only=True, default="")
    is_negotiable = serializers.BooleanField(read_only=True)

    class Meta:
        model = Service
        fields = [
            "id",
            "category",
            "category_name",
            "category_icon",
            "subcategory",
            "subcategory_name",
            "name",
            "slug",
            "short_description",
            "full_description",
            "image_url",
            "price",
            "is_negotiable",
            "featured",
            "sort_order",
            "active",
            "created_at",
        ]

class ProviderProfessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderProfession
        fields = ["id", "name", "slug", "description", "icon", "sort_order", "active"]

class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ["id", "title", "subtitle", "image_url", "link_url", "sort_order", "active"]

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["id", "client_name", "client_avatar", "service", "rating", "comment", "location", "featured", "created_at"]

class FAQSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, default="")

    class Meta:
        model = FAQ
        fields = ["id", "category", "category_name", "question", "answer", "sort_order", "active"]

class ServiceAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceArea
        fields = ["id", "name", "state", "active"]
