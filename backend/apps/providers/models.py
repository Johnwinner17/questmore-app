from django.db import models
from django.contrib.auth.models import User
from apps.catalogue.models import ProviderProfession

class ProviderProfile(models.Model):
    VERIFICATION_STATUS_CHOICES = [
        ("awaiting_verification", "Awaiting Verification"),
        ("verified", "Verified"),
        ("rejected", "Rejected"),
        ("suspended", "Suspended"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="provider_profile")
    profession = models.ForeignKey(ProviderProfession, on_delete=models.SET_NULL, null=True, blank=True)
    profession_name = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=50, unique=True)
    location = models.CharField(max_length=255, default="Abuja (FCT)")
    address = models.TextField(null=True, blank=True)
    experience_years = models.IntegerField(default=1)
    qualifications = models.TextField(null=True, blank=True)
    id_document_url = models.URLField(max_length=1000, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    avatar_url = models.URLField(max_length=1000, null=True, blank=True)
    verification_status = models.CharField(
        max_length=50,
        choices=VERIFICATION_STATUS_CHOICES,
        default="awaiting_verification"
    )
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Provider Profile"
        verbose_name_plural = "Provider Profiles"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.profession_name or 'Specialist'})"

    def save(self, *args, **kwargs):
        self.verified = (self.verification_status == "verified")
        if self.profession and not self.profession_name:
            self.profession_name = self.profession.name
        super().save(*args, **kwargs)
