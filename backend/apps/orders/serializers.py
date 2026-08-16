from rest_framework import serializers
from apps.catalogue.serializers import ServiceSerializer
from .models import Cart, CartItem, ServiceRequest, JobMessage

class CartItemSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    service_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "service", "service_id", "added_at"]

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_amount = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items", "total_amount", "created_at", "updated_at"]

class JobMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobMessage
        fields = ["id", "request", "sender_id", "sender_role", "sender_name", "message", "created_at"]
        read_only_fields = ["id", "created_at"]

class ServiceRequestSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, default="")
    messages = JobMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ServiceRequest
        fields = [
            "id",
            "request_code",
            "user",
            "full_name",
            "email",
            "phone",
            "category",
            "category_name",
            "service",
            "selected_services",
            "description",
            "location",
            "address",
            "preferred_date",
            "preferred_time",
            "urgency",
            "booking_fee",
            "services_total",
            "total_amount",
            "payment_status",
            "payment_ref",
            "payment_method",
            "paid_at",
            "assigned_provider_id",
            "provider_name",
            "provider_phone",
            "provider_profession",
            "job_status",
            "status_note",
            "client_confirmed",
            "assigned_at",
            "accepted_at",
            "work_started_at",
            "work_completed_at",
            "completed_at",
            "created_at",
            "messages",
        ]
        read_only_fields = ["id", "request_code", "created_at"]
