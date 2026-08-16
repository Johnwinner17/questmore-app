import uuid
from django.db import models
from django.contrib.auth.models import User
from apps.catalogue.models import Service, Category

class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="cart")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Cart"
        verbose_name_plural = "Carts"

    def __str__(self):
        return f"Cart of {self.user.email}"

    @property
    def total_amount(self):
        services_total = sum(item.service.price or 0 for item in self.items.all() if item.service.price)
        booking_fee = 5000
        return services_total + booking_fee


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("cart", "service")
        ordering = ["-added_at"]

    def __str__(self):
        return f"{self.service.name} in cart {self.cart_id}"


class ServiceRequest(models.Model):
    """
    Core QuestMore Service Request / Job lifecycle model.
    """
    JOB_STATUS_CHOICES = [
        ("request_submitted", "Request Submitted"),
        ("awaiting_admin_review", "Awaiting Admin Review"),
        ("payment_verified", "Payment Verified"),
        ("awaiting_assignment", "Awaiting Specialist Assignment"),
        ("provider_assigned", "Specialist Assigned"),
        ("provider_accepted", "Specialist Accepted"),
        ("work_in_progress", "Work in Progress"),
        ("work_completed", "Work Completed"),
        ("client_confirmation", "Client Confirmation"),
        ("completed", "Completed & Signed Off"),
        ("cancelled", "Cancelled"),
    ]

    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("successful", "Successful"),
        ("failed", "Failed"),
        ("cancelled", "Cancelled"),
    ]

    request_code = models.CharField(max_length=50, unique=True, default="")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="service_requests")
    full_name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255)
    phone = models.CharField(max_length=50, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True)
    selected_services = models.JSONField(default=list, blank=True) # Array of service items in basket
    description = models.TextField()
    location = models.CharField(max_length=255, null=True, blank=True, default="Abuja (FCT)")
    address = models.TextField(null=True, blank=True)
    preferred_date = models.DateField(null=True, blank=True)
    preferred_time = models.CharField(max_length=50, null=True, blank=True)
    urgency = models.CharField(max_length=50, default="standard")

    # Financial details
    booking_fee = models.IntegerField(default=5000)
    services_total = models.IntegerField(default=0)
    total_amount = models.IntegerField(default=5000)
    payment_status = models.CharField(max_length=50, choices=PAYMENT_STATUS_CHOICES, default="pending")
    payment_ref = models.CharField(max_length=100, null=True, blank=True)
    payment_method = models.CharField(max_length=50, default="card")
    paid_at = models.DateTimeField(null=True, blank=True)

    # Provider assignment
    assigned_provider_id = models.IntegerField(null=True, blank=True)
    provider_name = models.CharField(max_length=255, null=True, blank=True)
    provider_phone = models.CharField(max_length=50, null=True, blank=True)
    provider_profession = models.CharField(max_length=100, null=True, blank=True)

    # Workflow lifecycle
    job_status = models.CharField(max_length=50, choices=JOB_STATUS_CHOICES, default="awaiting_admin_review")
    status_note = models.TextField(null=True, blank=True)
    client_confirmed = models.BooleanField(default=False)

    # Timestamps
    assigned_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    work_started_at = models.DateTimeField(null=True, blank=True)
    work_completed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Service Request"
        verbose_name_plural = "Service Requests"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.request_code:
            self.request_code = f"QM-REQ-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.request_code} - {self.full_name} ({self.job_status})"


class JobMessage(models.Model):
    request = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE, related_name="messages")
    sender_id = models.IntegerField(null=True, blank=True)
    sender_role = models.CharField(max_length=50, default="client") # 'client' | 'provider' | 'admin'
    sender_name = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Message by {self.sender_name} on {self.request.request_code}"
