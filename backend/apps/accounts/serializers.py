from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ClientProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]

class ClientProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)

    class Meta:
        model = ClientProfile
        fields = [
            "id",
            "user",
            "full_name",
            "email",
            "google_id",
            "avatar_url",
            "phone",
            "location",
            "address",
            "is_google_auth",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "google_id", "is_google_auth", "created_at", "updated_at"]

class GoogleAuthSerializer(serializers.Serializer):
    credential = serializers.CharField(required=False, allow_blank=True) # Google ID Token from GIS
    access_token = serializers.CharField(required=False, allow_blank=True) # Access token from OAuth flow
    email = serializers.EmailField(required=False)
    name = serializers.CharField(required=False, allow_blank=True)
    picture = serializers.URLField(required=False, allow_blank=True)
    google_id = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
