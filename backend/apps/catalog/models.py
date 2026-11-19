from django.db import models
from django.utils.text import slugify
from apps.core.models import BaseModel

class Department(BaseModel):
    """Luxury departments: Watches and Jewellery."""
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=60, unique=True, db_index=True)
    description = models.TextField(blank=True)
    banner_image = models.ImageField(upload_to='departments/', blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Category(BaseModel):
    """Categories organized by department."""
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, db_index=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['department', 'name']
        unique_together = ('department', 'slug')

    def __str__(self):
        return f"{self.department.name} > {self.name}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.department.slug}-{self.name}")
        super().save(*args, **kwargs)


class Product(BaseModel):
    """Core product entity for Watches and Jewellery."""
    DEPARTMENT_TYPE_CHOICES = (
        ('WATCH', 'Watch'),
        ('JEWELLERY', 'Jewellery'),
    )

    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    department_type = models.CharField(max_length=20, choices=DEPARTMENT_TYPE_CHOICES, db_index=True)
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=280, unique=True, db_index=True)
    brand = models.CharField(max_length=100, db_index=True)
    short_description = models.CharField(max_length=500, blank=True)
    description = models.TextField()
    base_price = models.DecimalField(max_digits=12, decimal_places=2, help_text="Base price in FCFA (XAF)")
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    # Department-specific specifications (e.g., movement, water resistance for watches; metal purity, carat for jewellery)
    department_specs = models.JSONField(
        default=dict,
        blank=True,
        help_text="Custom key-value attributes specific to Watches or Jewellery"
    )

    class Meta:
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.brand}] {self.name}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.brand}-{self.name}")
        # Sync department_type with parent category department
        if self.category and self.category.department:
            self.department_type = 'WATCH' if 'watch' in self.category.department.slug else 'JEWELLERY'
        super().save(*args, **kwargs)

    @property
    def primary_image(self):
        primary = self.images.filter(is_primary=True).first()
        if primary:
            return primary.image.url if primary.image else None
        first = self.images.first()
        return first.image.url if first and first.image else None


class ProductVariant(BaseModel):
    """Physical product variant (e.g., strap/dial combo for watches, ring size for jewellery)."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    sku = models.CharField(max_length=100, unique=True, db_index=True)
    title = models.CharField(max_length=150, help_text="e.g. 41mm Stainless Steel / Blue Dial, Size 54 / 18k Gold")
    price_override = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Leave blank to inherit the product base price"
    )
    attributes = models.JSONField(
        default=dict,
        help_text="Key-value pairs for variant options: {'strap': 'Leather', 'dial': 'Blue'} or {'ring_size': '54'}"
    )
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Product Variant'
        verbose_name_plural = 'Product Variants'
        ordering = ['-is_default', 'title']

    def __str__(self):
        return f"{self.product.name} — {self.title} ({self.sku})"

    @property
    def price(self):
        return self.price_override if self.price_override is not None else self.product.base_price

    @property
    def is_in_stock(self):
        stock = getattr(self, 'stock_record', None)
        return stock.is_available if stock else False

    def save(self, *args, **kwargs):
        if self.is_default:
            ProductVariant.objects.filter(product=self.product, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class ProductImage(BaseModel):
    """High-resolution imagery for products and specific variants."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='variant_images'
    )
    image = models.ImageField(upload_to='products/%Y/%m/', max_length=500)
    alt_text = models.CharField(max_length=255, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Product Image'
        verbose_name_plural = 'Product Images'
        ordering = ['display_order', '-is_primary', '-created_at']

    def __str__(self):
        return f"Image for {self.product.name} (#{self.display_order})"

    def save(self, *args, **kwargs):
        if self.is_primary:
            ProductImage.objects.filter(product=self.product, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)

