from django.contrib import admin
from .models import (
    Category, Subcategory, Service,
    ProviderProfession, Banner, Review,
    FAQ, ServiceArea
)

class SubcategoryInline(admin.TabularInline):
    model = Subcategory
    extra = 1

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "icon", "sort_order", "active", "created_at")
    list_editable = ("sort_order", "active")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [SubcategoryInline]

@admin.register(Subcategory)
class SubcategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "slug", "sort_order", "active")
    list_filter = ("category", "active")
    list_editable = ("sort_order", "active")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "subcategory", "price_display", "featured", "active", "sort_order")
    list_filter = ("category", "featured", "active")
    list_editable = ("featured", "active", "sort_order")
    search_fields = ("name", "short_description", "full_description")
    prepopulated_fields = {"slug": ("name",)}

    def price_display(self, obj):
        if obj.price:
            return f"₦{obj.price:,}"
        return "Negotiable"
    price_display.short_description = "Price"

@admin.register(ProviderProfession)
class ProviderProfessionAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "icon", "sort_order", "active")
    list_editable = ("sort_order", "active")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}

@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("title", "subtitle", "sort_order", "active")
    list_editable = ("sort_order", "active")

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("client_name", "rating", "service", "location", "featured", "created_at")
    list_filter = ("rating", "featured")
    list_editable = ("featured",)
    search_fields = ("client_name", "comment", "location")

@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ("question", "category", "sort_order", "active")
    list_filter = ("category", "active")
    list_editable = ("sort_order", "active")

@admin.register(ServiceArea)
class ServiceAreaAdmin(admin.ModelAdmin):
    list_display = ("name", "state", "active")
    list_filter = ("state", "active")
    list_editable = ("active",)
