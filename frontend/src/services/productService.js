import {
  MOCK_PRODUCTS,
  MOCK_REVIEWS,
  FILTER_OPTIONS,
  SEARCH_SUGGESTIONS,
} from '@/utils/mockData';

/**
 * Product Service
 * Handles querying, searching, filtering, and sorting for FARÉL watches and jewellery.
 * Prepared for seamless integration with Django REST Framework API (/api/v1/catalog/products/).
 */
class ProductService {
  /**
   * Query products with comprehensive filtering, search, and sorting
   * @param {Object} params - Query parameters
   * @returns {Promise<{ products: Array, total: number, availableFilters: Object }>}
   */
  async getProducts(params = {}) {
    // Simulate async network latency for realistic feel
    await new Promise((resolve) => setTimeout(resolve, 80));

    const {
      department,
      category,
      brand,
      gender,
      minPrice,
      maxPrice,
      color,
      material,
      inStockOnly,
      minRating,
      search,
      sort = 'newest',
    } = params;

    let filtered = [...MOCK_PRODUCTS];

    // 1. Department Filter (WATCH | JEWELLERY)
    if (department && department !== 'ALL') {
      filtered = filtered.filter(
        (p) => p.department_type?.toUpperCase() === department.toUpperCase()
      );
    }

    // 2. Category Filter
    if (category && category !== 'ALL') {
      filtered = filtered.filter((p) => {
        const catSlug = p.category_slug || '';
        const catName = p.category || p.category_name || '';
        return (
          catSlug.toLowerCase() === category.toLowerCase() ||
          catName.toLowerCase() === category.toLowerCase()
        );
      });
    }

    // 3. Brand Filter
    if (brand && brand !== 'ALL') {
      const brandsList = Array.isArray(brand) ? brand : [brand];
      filtered = filtered.filter((p) =>
        brandsList.some((b) => b.toLowerCase() === (p.brand || '').toLowerCase())
      );
    }

    // 4. Gender Filter
    if (gender && gender !== 'ALL') {
      filtered = filtered.filter(
        (p) => (p.gender || '').toLowerCase() === gender.toLowerCase()
      );
    }

    // 5. Price Range Filter
    if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
      const min = Number(minPrice);
      if (!isNaN(min)) {
        filtered = filtered.filter((p) => p.price >= min);
      }
    }
    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
      const max = Number(maxPrice);
      if (!isNaN(max)) {
        filtered = filtered.filter((p) => p.price <= max);
      }
    }

    // 6. Colour Filter
    if (color && color !== 'ALL') {
      const colorsList = Array.isArray(color) ? color : [color];
      filtered = filtered.filter((p) =>
        (p.colors || []).some((c) =>
          colorsList.some((col) => col.toLowerCase() === c.toLowerCase())
        )
      );
    }

    // 7. Material Filter
    if (material && material !== 'ALL') {
      const materialsList = Array.isArray(material) ? material : [material];
      filtered = filtered.filter((p) =>
        (p.materials || []).some((m) =>
          materialsList.some((mat) => mat.toLowerCase() === m.toLowerCase())
        )
      );
    }

    // 8. Availability Filter
    if (inStockOnly === true || inStockOnly === 'true') {
      filtered = filtered.filter((p) => {
        const hasVariantStock = (p.variants || []).some((v) => v.in_stock && v.stock_quantity > 0);
        return p.in_stock !== false || hasVariantStock;
      });
    }

    // 9. Minimum Rating Filter
    if (minRating) {
      const rating = Number(minRating);
      if (!isNaN(rating)) {
        filtered = filtered.filter((p) => (p.rating || 0) >= rating);
      }
    }

    // 10. Multi-field Search Filter
    // Searches by: Product name, SKU, Brand, Category, Description
    if (search && search.trim() !== '') {
      const query = search.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const nameMatch = (p.name || '').toLowerCase().includes(query);
        const skuMatch = (p.sku || '').toLowerCase().includes(query);
        const brandMatch = (p.brand || '').toLowerCase().includes(query);
        const categoryMatch = (p.category || p.category_name || '').toLowerCase().includes(query);
        const descriptionMatch = (p.description || p.short_description || '').toLowerCase().includes(query);
        const tagsMatch = (p.tags || []).some((t) => t.toLowerCase().includes(query));
        const variantSkuMatch = (p.variants || []).some((v) => (v.sku || '').toLowerCase().includes(query));

        return (
          nameMatch ||
          skuMatch ||
          brandMatch ||
          categoryMatch ||
          descriptionMatch ||
          tagsMatch ||
          variantSkuMatch
        );
      });
    }

    // 11. Sorting
    switch (sort) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popularity':
        filtered.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
        break;
      case 'newest':
      default:
        // Prioritize is_new_arrival, then id
        filtered.sort((a, b) => (b.is_new_arrival ? 1 : 0) - (a.is_new_arrival ? 1 : 0));
        break;
    }

    return {
      products: filtered,
      total: filtered.length,
      availableFilters: FILTER_OPTIONS,
    };
  }

  /**
   * Get product by slug or ID
   * @param {string} slugOrId
   * @returns {Promise<Object|null>}
   */
  async getProductBySlug(slugOrId) {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const product = MOCK_PRODUCTS.find(
      (p) => p.slug === slugOrId || p.id === slugOrId
    );
    return product || null;
  }

  /**
   * Get related products for a product
   * @param {string} productId
   * @returns {Promise<Array>}
   */
  async getRelatedProducts(productId) {
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (!product) return [];

    if (product.related_products && product.related_products.length > 0) {
      return product.related_products
        .map((relId) => MOCK_PRODUCTS.find((p) => p.id === relId))
        .filter(Boolean);
    }

    // Fallback: Same department products
    return MOCK_PRODUCTS.filter(
      (p) => p.department_type === product.department_type && p.id !== productId
    ).slice(0, 4);
  }

  /**
   * Get customer reviews for a product
   * @param {string} productId
   * @returns {Promise<Array>}
   */
  async getReviews(productId) {
    return MOCK_REVIEWS[productId] || [];
  }

  /**
   * Add a new review to a product
   * @param {string} productId
   * @param {Object} reviewData
   * @returns {Promise<Object>}
   */
  async addReview(productId, reviewData) {
    const newReview = {
      id: `rev-${Date.now()}`,
      author: reviewData.author || 'Client Vérifié',
      rating: Number(reviewData.rating) || 5,
      title: reviewData.title || '',
      comment: reviewData.comment || '',
      date: new Date().toISOString().split('T')[0],
      verified_purchase: true,
    };

    if (!MOCK_REVIEWS[productId]) {
      MOCK_REVIEWS[productId] = [];
    }
    MOCK_REVIEWS[productId].unshift(newReview);
    return newReview;
  }

  /**
   * Get instant search suggestions
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async getSearchSuggestions(query = '') {
    if (!query || query.trim().length === 0) {
      return SEARCH_SUGGESTIONS.slice(0, 6);
    }
    const q = query.toLowerCase();
    const suggestions = SEARCH_SUGGESTIONS.filter((s) =>
      s.toLowerCase().includes(q)
    );

    // Also match product names and brands
    const productMatches = MOCK_PRODUCTS.filter((p) =>
      p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    )
      .map((p) => p.name)
      .slice(0, 4);

    return Array.from(new Set([...suggestions, ...productMatches])).slice(0, 6);
  }
}

export const productService = new ProductService();
export default productService;
