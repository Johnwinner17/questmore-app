from django.urls import path
from .views import GoogleAuthView, ClientProfileView

urlpatterns = [
    path("google/", GoogleAuthView.as_view(), name="auth-google"),
    path("profile/", ClientProfileView.as_view(), name="auth-profile"),
]
