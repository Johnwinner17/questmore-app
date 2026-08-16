from django.db import models
from django.contrib.auth.models import User


class ClientProfile(models.Model):
    """
    Extended profile for client users authenticated via Google OAuth.
    The core auth (username/password) is handled by Django's built-in User model.
    Google identity info is stored here.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="client_profile")

    # Google OAuth identity
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    avatar_url = models.URLField(max_length=1000, null=True, blank=True)

    # Contact & location
    phone = models.CharField(max_length=50, null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True, default="Abuja (FCT)")
    address = models.TextField(null=True, blank=True)

    # Metadata
    is_google_auth = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Client Profile"
        verbose_name_plural = "Client Profiles"

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.user.email})"

    @property
    def full_name(self):
        return self.user.get_full_name() or self.user.username

    @property
    def email(self):
        return self.user.email
