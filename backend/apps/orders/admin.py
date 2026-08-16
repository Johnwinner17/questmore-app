from django.contrib import admin
from .models import Cart, CartItem, ServiceRequest, JobMessage

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("user", "item_count", "total_amount_display", "updated_at")
    inlines = [CartItemInline]

    def item_count(self, obj):
        return obj.items.count()
    item_count.short_description = "Items in Cart"

    def total_amount_display(self, obj):
        return f"₦{obj.total_amount:,}"
    total_amount_display.short_description = "Total"


class JobMessageInline(admin.TabularInline):
    model = JobMessage
    extra = 0
    readonly_fields = ("sender_role", "sender_name", "message", "created_at")


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = (
        "request_code", "full_name", "email", "total_amount_display",
        "payment_status", "job_status", "provider_name", "created_at"
    )
    list_filter = ("job_status", "payment_status", "category", "created_at")
    list_editable = ("job_status", "payment_status")
    search_fields = ("request_code", "full_name", "email", "phone", "provider_name")
    readonly_fields = ("request_code", "created_at")
    inlines = [JobMessageInline]

    def total_amount_display(self, obj):
        return f"₦{obj.total_amount:,}"
    total_amount_display.short_description = "Amount"


@admin.register(JobMessage)
class JobMessageAdmin(admin.ModelAdmin):
    list_display = ("request", "sender_name", "sender_role", "message", "created_at")
    list_filter = ("sender_role", "created_at")
    search_fields = ("request__request_code", "sender_name", "message")
