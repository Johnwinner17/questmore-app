from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(null=True, blank=True)
    icon = models.CharField(max_length=100, null=True, blank=True, default="building")
    image_url = models.URLField(max_length=1000, null=True, blank=True)
    sort_order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class Subcategory(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="subcategories")
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    description = models.TextField(null=True, blank=True)
    icon = models.CharField(max_length=100, null=True, blank=True)
    image_url = models.URLField(max_length=1000, null=True, blank=True)
    sort_order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Subcategory"
        verbose_name_plural = "Subcategories"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return f"{self.category.name} -> {self.name}"


class Service(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="services")
    subcategory = models.ForeignKey(Subcategory, on_delete=models.CASCADE, related_name="services", null=True, blank=True)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    short_description = models.TextField(null=True, blank=True)
    full_description = models.TextField(null=True, blank=True)
    image_url = models.URLField(max_length=1000, null=True, blank=True)
    price = models.IntegerField(null=True, blank=True, help_text="Fixed price in NGN. Leave empty if Negotiable / Contact.")
    featured = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Service"
        verbose_name_plural = "Services"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return f"{self.name} ({self.category.name})"

    @property
    def is_negotiable(self):
        return self.price is None or self.price <= 0


class ProviderProfession(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(null=True, blank=True)
    icon = models.CharField(max_length=100, default="🔧")
    sort_order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Provider Profession"
        verbose_name_plural = "Provider Professions"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class Banner(models.Model):
    title = models.CharField(max_length=255)
    subtitle = models.TextField(null=True, blank=True)
    image_url = models.URLField(max_length=1000, null=True, blank=True)
    link_url = models.CharField(max_length=500, null=True, blank=True)
    sort_order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Banner"
        verbose_name_plural = "Banners"
        ordering = ["sort_order"]

    def __str__(self):
        return self.title


class Review(models.Model):
    client_name = models.CharField(max_length=255)
    client_avatar = models.URLField(max_length=1000, null=True, blank=True)
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews")
    rating = models.IntegerField(default=5)
    comment = models.TextField(null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Review"
        verbose_name_plural = "Reviews"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.client_name} - {self.rating} stars"


class FAQ(models.Model):
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="faqs")
    question = models.TextField()
    answer = models.TextField()
    sort_order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "FAQ"
        verbose_name_plural = "FAQs"
        ordering = ["sort_order"]

    def __str__(self):
        return self.question[:50]


class ServiceArea(models.Model):
    name = models.CharField(max_length=255)
    state = models.CharField(max_length=100)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Service Area"
        verbose_name_plural = "Service Areas"
        ordering = ["state", "name"]

    def __str__(self):
        return f"{self.name}, {self.state}"
