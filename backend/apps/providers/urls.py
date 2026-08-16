from django.urls import path
from .views import ProviderAuthView, ProviderJobsView

urlpatterns = [
    path("auth/", ProviderAuthView.as_view(), name="provider-auth"),
    path("jobs/", ProviderJobsView.as_view(), name="provider-jobs"),
]
