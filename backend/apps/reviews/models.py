from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import BaseModel
from apps.catalog.models import Product
from apps.accounts.models import User

class Review(BaseModel):
    """Customer ratings and testimonials for luxury watches and jewellery."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    author_name = models.CharField(max_length=100)
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating score from 1 (lowest) to 5 (highest)"
    )
    title = models.CharField(max_length=150)
    comment = models.TextField()
    is_verified_purchase = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=True, help_text="Controlled by store moderation")

    class Meta:
        verbose_name = 'Customer Review'
        verbose_name_plural = 'Customer Reviews'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.rating}★ by {self.author_name} for {self.product.name}"


class ReviewImage(BaseModel):
    """Customer photo attachments for reviews."""
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='reviews/%Y/%m/')
    alt_text = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = 'Review Image'
        verbose_name_plural = 'Review Images'

