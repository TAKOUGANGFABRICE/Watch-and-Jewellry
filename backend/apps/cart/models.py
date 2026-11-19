from django.db import models
from apps.core.models import BaseModel
from apps.catalog.models import ProductVariant
from apps.accounts.models import User

class Cart(BaseModel):
    """Shared shopping cart supporting both authenticated users and guest sessions."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='carts')
    session_token = models.CharField(max_length=128, null=True, blank=True, db_index=True)

    class Meta:
        verbose_name = 'Shopping Cart'
        verbose_name_plural = 'Shopping Carts'
        ordering = ['-updated_at']

    def __str__(self):
        owner = self.user.email if self.user else f"Guest ({self.session_token[:8]}...)" if self.session_token else "Anonymous"
        return f"Cart #{str(self.id)[:8]} for {owner}"

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())

    @property
    def subtotal(self):
        return sum(item.total_price for item in self.items.all())

    @property
    def is_empty(self):
        return not self.items.exists()

    def merge_with_guest_cart(self, guest_cart):
        """Merges items from a guest cart into this user cart upon login."""
        if not guest_cart or guest_cart.pk == self.pk:
            return

        for guest_item in guest_cart.items.all():
            existing_item = self.items.filter(variant=guest_item.variant).first()
            if existing_item:
                existing_item.quantity += guest_item.quantity
                existing_item.save()
            else:
                guest_item.cart = self
                guest_item.save()

        # Delete guest cart after merge
        guest_cart.delete()


class CartItem(BaseModel):
    """Line item in a shopping cart."""
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name = 'Cart Item'
        verbose_name_plural = 'Cart Items'
        unique_together = ('cart', 'variant')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.quantity}x {self.variant.title} in Cart #{str(self.cart.id)[:8]}"

    @property
    def unit_price(self):
        return self.variant.price

    @property
    def total_price(self):
        return self.unit_price * self.quantity

