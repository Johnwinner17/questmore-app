from django.contrib import admin
from .models import ProviderProfile

@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = (
        "get_name", "profession_name", "phone", "experience_years",
        "location", "verification_status", "verified", "created_at"
    )
    list_filter = ("verification_status", "profession_name", "location", "created_at")
    list_editable = ("verification_status",)
    search_fields = ("user__first_name", "user__last_name", "phone", "profession_name", "location")
    readonly_fields = ("created_at", "updated_at")

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_name.short_description = "Provider Name"
