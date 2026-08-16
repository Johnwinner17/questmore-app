from django.contrib import admin
from .models import ClientProfile

@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "phone", "location", "is_google_auth", "created_at")
    search_fields = ("user__email", "user__first_name", "user__last_name", "phone", "location")
    list_filter = ("is_google_auth", "location", "created_at")
    readonly_fields = ("google_id", "created_at", "updated_at")
