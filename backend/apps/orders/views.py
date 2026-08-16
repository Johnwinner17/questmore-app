from datetime import datetime
from rest_framework import views, viewsets, status, permissions, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from apps.catalogue.models import Service
from .models import Cart, CartItem, ServiceRequest, JobMessage
from .serializers import CartSerializer, ServiceRequestSerializer, JobMessageSerializer

class CartView(views.APIView):
    """
    Get, add, or remove items from the authenticated user's cart in PostgreSQL.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(cart).data)

    def post(self, request):
        """Add service to cart"""
        service_id = request.data.get("service_id")
        if not service_id:
            return Response({"error": "service_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            return Response({"error": "Service not found"}, status=status.HTTP_404_NOT_FOUND)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        CartItem.objects.get_or_create(cart=cart, service=service)

        return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        """Remove specific item or clear cart"""
        service_id = request.data.get("service_id")
        cart, _ = Cart.objects.get_or_create(user=request.user)

        if service_id:
            CartItem.objects.filter(cart=cart, service_id=service_id).delete()
        else:
            cart.items.all().delete()

        return Response(CartSerializer(cart).data)


class ServiceRequestViewSet(viewsets.ModelViewSet):
    """
    Manage Service Requests & Client Orders.
    """
    queryset = ServiceRequest.objects.all().select_related("category", "service")
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["payment_status", "job_status", "assigned_provider_id", "email"]
    search_fields = ["request_code", "full_name", "email", "phone", "description", "location"]
    ordering_fields = ["created_at", "total_amount"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        email = self.request.query_params.get("email")

        if user and user.is_authenticated and not user.is_staff:
            # Normal client only sees their own requests
            return qs.filter(user=user)
        elif email and (not user or not user.is_staff):
            return qs.filter(email__iexact=email)

        return qs

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        
        # Calculate totals
        selected_services = self.request.data.get("selected_services", [])
        booking_fee = 5000
        services_total = 0

        if isinstance(selected_services, list):
            for s in selected_services:
                price = s.get("price")
                if price and isinstance(price, (int, float)) and not s.get("isNegotiable"):
                    services_total += int(price)

        total_amount = services_total + booking_fee
        payment_status = self.request.data.get("payment_status", "successful")

        serializer.save(
            user=user,
            booking_fee=booking_fee,
            services_total=services_total,
            total_amount=total_amount,
            paid_at=datetime.now() if payment_status == "successful" else None,
            job_status="awaiting_admin_review" if payment_status == "successful" else "request_submitted",
            status_note="Payment received. Your job request is awaiting QuestMore Admin review and approval."
        )

        # Clear cart if request user has a cart
        if user:
            CartItem.objects.filter(cart__user=user).delete()

    @action(detail=True, methods=["post"], permission_classes=[permissions.AllowAny])
    def confirm_completion(self, request, pk=None):
        """Client signs off on completed job"""
        instance = self.get_object()
        instance.job_status = "completed"
        instance.client_confirmed = True
        instance.completed_at = datetime.now()
        instance.status_note = "Job successfully completed and signed off with QA warranty."
        instance.save()
        return Response(ServiceRequestSerializer(instance).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.AllowAny])
    def post_message(self, request, pk=None):
        """In-job messaging"""
        instance = self.get_object()
        msg_text = request.data.get("message")
        sender_name = request.data.get("sender_name", "Client")
        sender_role = request.data.get("sender_role", "client")

        if not msg_text:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

        msg = JobMessage.objects.create(
            request=instance,
            sender_id=request.user.id if request.user.is_authenticated else None,
            sender_role=sender_role,
            sender_name=sender_name,
            message=msg_text
        )
        return Response(JobMessageSerializer(msg).data, status=status.HTTP_201_CREATED)
