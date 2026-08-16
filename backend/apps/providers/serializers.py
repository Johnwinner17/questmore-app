from rest_framework import serializers
from .models import ProviderProfile

class ProviderProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.get_full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = ProviderProfile
        fields = [
            "id",
            "full_name",
            "email",
            "phone",
            "profession",
            "profession_name",
            "experience_years",
            "qualifications",
            "id_document_url",
            "bio",
            "avatar_url",
            "location",
            "address",
            "verification_status",
            "verified",
            "created_at",
        ]
        read_only_fields = ["id", "verified", "created_at"]
