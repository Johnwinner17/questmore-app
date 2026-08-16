from django.contrib.auth.models import User
from rest_framework import views, viewsets, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import ProviderProfile
from .serializers import ProviderProfileSerializer
from apps.orders.models import ServiceRequest
from apps.orders.serializers import ServiceRequestSerializer

class ProviderAuthView(views.APIView):
    """
    Register or log in service provider using phone & password.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        action = request.data.get("action", "login") # 'login' | 'register'
        phone = request.data.get("phone", "").strip()
        password = request.data.get("password", "").strip()

        if not phone or not password:
            return Response({"error": "Phone and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        if action == "register":
            full_name = request.data.get("fullName", "").strip()
            email = request.data.get("email", f"{phone.replace('+', '').replace(' ', '')}@questmore.provider")
            profession_name = request.data.get("professionName", "")
            location = request.data.get("location", "Abuja (FCT)")
            experience = int(request.data.get("experienceYears", 1))
            qualifications = request.data.get("qualifications", "")
            bio = request.data.get("bio", "")

            if ProviderProfile.objects.filter(phone=phone).exists():
                return Response({"error": "A provider with this phone number already exists. Please log in."}, status=status.HTTP_400_BAD_REQUEST)

            username = f"prov_{phone.replace('+', '').replace(' ', '')}"
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=full_name.split()[0] if full_name else "Provider",
                last_name=" ".join(full_name.split()[1:]) if len(full_name.split()) > 1 else ""
            )

            profile = ProviderProfile.objects.create(
                user=user,
                phone=phone,
                profession_name=profession_name,
                location=location,
                experience_years=experience,
                qualifications=qualifications,
                bio=bio,
                avatar_url=f"https://api.dicebear.com/7.x/initials/svg?seed={encode_seed(full_name)}",
                verification_status="awaiting_verification"
            )

            refresh = RefreshToken.for_user(user)
            return Response({
                "success": True,
                "message": "Provider registered successfully. Account awaiting admin verification.",
                "user": format_provider_response(profile),
                "tokens": {"access": str(refresh.access_token), "refresh": str(refresh)}
            }, status=status.HTTP_201_CREATED)

        else:
            # Login
            profile = ProviderProfile.objects.filter(phone=phone).first()
            if not profile or not profile.user.check_password(password):
                return Response({"error": "Invalid phone number or password."}, status=status.HTTP_400_BAD_REQUEST)

            refresh = RefreshToken.for_user(profile.user)
            return Response({
                "success": True,
                "user": format_provider_response(profile),
                "tokens": {"access": str(refresh.access_token), "refresh": str(refresh)}
            })


class ProviderJobsView(views.APIView):
    """
    Retrieve assigned jobs for a specific provider and execute provider status transitions.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        provider_id = request.query_params.get("providerId")
        if not provider_id:
            return Response({"error": "providerId is required"}, status=status.HTTP_400_BAD_REQUEST)

        jobs = ServiceRequest.objects.filter(assigned_provider_id=int(provider_id))
        return Response(ServiceRequestSerializer(jobs, many=True).data)

    def put(self, request):
        job_id = request.data.get("jobId")
        action = request.data.get("action") # 'accept' | 'start' | 'complete'

        if not job_id or not action:
            return Response({"error": "jobId and action are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            job = ServiceRequest.objects.get(id=int(job_id))
        except ServiceRequest.DoesNotExist:
            return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)

        if action == "accept":
            job.job_status = "provider_accepted"
            job.status_note = f"Job accepted by {job.provider_name}. Preparing deployment."
        elif action == "start":
            job.job_status = "work_in_progress"
            job.status_note = f"Work in progress on site by {job.provider_name}."
        elif action == "complete":
            job.job_status = "work_completed"
            job.status_note = "Work marked as completed by provider. Awaiting client QA sign-off."

        job.save()
        return Response(ServiceRequestSerializer(job).data)


def format_provider_response(profile):
    return {
        "id": profile.id,
        "djangoUserId": profile.user.id,
        "role": "provider",
        "fullName": profile.user.get_full_name() or "Specialist",
        "email": profile.user.email,
        "phone": profile.phone,
        "professionName": profile.profession_name,
        "experienceYears": profile.experience_years,
        "location": profile.location,
        "avatarUrl": profile.avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={profile.phone}",
        "verificationStatus": profile.verification_status,
        "verified": profile.verified,
        "createdAt": profile.created_at.isoformat(),
    }

def encode_seed(name):
    import urllib.parse
    return urllib.parse.quote(name or "Provider")
