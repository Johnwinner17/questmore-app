from django.db import models

class GalleryPhoto(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    before_image_url = models.URLField(max_length=1000, null=True, blank=True)
    after_image_url = models.URLField(max_length=1000, null=True, blank=True)
    photo_file = models.ImageField(upload_to="gallery/", null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True, default="Abuja")
    featured = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Gallery Photo"
        verbose_name_plural = "Photo Gallery"
        ordering = ["sort_order", "-created_at"]

    def __str__(self):
        return self.title

    @property
    def display_url(self):
        if self.after_image_url:
            return self.after_image_url
        if self.photo_file:
            return self.photo_file.url
        return self.before_image_url or ""
