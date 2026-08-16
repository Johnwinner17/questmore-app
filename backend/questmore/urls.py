"""QuestMore URL Configuration"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Customize Django Admin
admin.site.site_header = "QuestMore Operations"
admin.site.site_title = "QuestMore Admin"
admin.site.index_title = "Management Dashboard"

urlpatterns = [
    # Django Admin (full management UI)
    path("admin/", admin.site.urls),

    # API v1
    path("api/auth/", include("apps.accounts.urls")),
    path("api/catalogue/", include("apps.catalogue.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/gallery/", include("apps.gallery.urls")),
    path("api/providers/", include("apps.providers.urls")),

    # JWT token endpoints
    path("api/token/", include("apps.accounts.token_urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
