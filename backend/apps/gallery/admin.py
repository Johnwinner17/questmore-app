from django.contrib import admin
from django.utils.html import format_html
from .models import GalleryPhoto

@admin.register(GalleryPhoto)
class GalleryPhotoAdmin(admin.ModelAdmin):
    list_display = ("title", "preview_image", "location", "featured", "sort_order", "created_at")
    list_filter = ("featured", "location", "created_at")
    list_editable = ("featured", "sort_order")
    search_fields = ("title", "description", "location")

    def preview_image(self, obj):
        url = obj.display_url
        if url:
            return format_html('<img src="{}" style="height: 45px; width: 65px; object-fit: cover; border-radius: 6px;" />', url)
        return "No image"
    preview_image.short_description = "Thumbnail"
