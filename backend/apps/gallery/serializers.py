from rest_framework import serializers
from .models import GalleryPhoto

class GalleryPhotoSerializer(serializers.ModelSerializer):
    display_url = serializers.CharField(read_only=True)

    # Alias matching frontend ProjectGalleryItem type
    beforeImageUrl = serializers.CharField(source="before_image_url", required=False, allow_blank=True)
    afterImageUrl = serializers.CharField(source="after_image_url", required=False, allow_blank=True)

    class Meta:
        model = GalleryPhoto
        fields = [
            "id",
            "title",
            "description",
            "before_image_url",
            "after_image_url",
            "beforeImageUrl",
            "afterImageUrl",
            "display_url",
            "photo_file",
            "location",
            "featured",
            "sort_order",
            "created_at",
        ]
