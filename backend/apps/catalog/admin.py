from django.contrib import admin
from .models import Department, Category, Product, ProductVariant, ProductImage

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

class ProductVariantInline(admin.StackedInline):
    model = ProductVariant
    extra = 1

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active')
    prepopulated_fields = {'slug': ('name',)}
    list_filter = ('is_active',)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'slug', 'is_active')
    list_filter = ('department', 'is_active')
    search_fields = ('name', 'slug')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'brand', 'category', 'department_type', 'base_price', 'is_featured', 'is_active', 'created_at')
    list_filter = ('department_type', 'category__department', 'category', 'brand', 'is_featured', 'is_active')
    search_fields = ('name', 'brand', 'description', 'slug')
    prepopulated_fields = {'slug': ('brand', 'name')}
    inlines = [ProductVariantInline, ProductImageInline]

@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('sku', 'product', 'title', 'price_override', 'is_default')
    list_filter = ('is_default', 'product__department_type')
    search_fields = ('sku', 'title', 'product__name', 'product__brand')

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'variant', 'display_order', 'is_primary', 'created_at')
    list_filter = ('is_primary', 'product__department_type')

