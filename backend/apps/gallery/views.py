from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import GalleryPhoto
from .serializers import GalleryPhotoSerializer

class GalleryViewSet(viewsets.ModelViewSet):
    queryset = GalleryPhoto.objects.all()
    serializer_class = GalleryPhotoSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        featured_only = self.request.query_params.get("featured")
        if featured_only == "true":
            qs = qs.filter(featured=True)
        return qs

    @action(detail=False, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def bulk_upload(self, request):
        """
        Upload multiple photos at once (URL array or uploaded file collection).
        """
        urls = request.data.get("urls", [])
        title_prefix = request.data.get("title_prefix", "Project Transformation")
        location = request.data.get("location", "Abuja")

        created = []
        for idx, url in enumerate(urls):
            if url and url.strip():
                photo = GalleryPhoto.objects.create(
                    title=f"{title_prefix} #{GalleryPhoto.objects.count() + 1}",
                    before_image_url=url.strip(),
                    after_image_url=url.strip(),
                    location=location,
                    featured=True,
                )
                created.append(photo)

        return Response(
            {"success": True, "created_count": len(created), "photos": GalleryPhotoSerializer(created, many=True).data},
            status=status.HTTP_201_CREATED
        )
