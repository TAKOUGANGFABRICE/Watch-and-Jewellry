import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard/ProductCard';
import FilterSidebar from '@/components/product/FilterSidebar/FilterSidebar';
import SkeletonCard from '@/components/common/Loading/SkeletonCard';
import EmptyState from '@/components/common/Loading/EmptyState';
import { useCart } from '@/context/CartContext';
import { useUI } from '@/context/UIContext';
import productService from '@/services/productService';
import { FILTER_OPTIONS } from '@/utils/mockData';
import styles from './ProductListing.module.css';

export default function ProductListing({
  department = 'ALL',
  title = 'Catalogue FARÉL',
  eyebrow = 'Haute Horlogerie & Joaillerie',
  subtitle = 'Découvrez des créations prestigieuses certifiées et garanties.',
  breadcrumbName = 'Catalogue',
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();
  const { openCartDrawer } = useUI();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Extract filter state from URL Search Params
  const currentFilters = {
    search: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    gender: searchParams.get('gender') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    color: searchParams.get('color') || '',
    material: searchParams.get('material') || '',
    inStockOnly: searchParams.get('inStock') === 'true',
    minRating: searchParams.get('minRating') || '',
    sort: searchParams.get('sort') || 'newest',
  };

  // Fetch products whenever filters or department change
  useEffect(() => {
    setIsLoading(true);
    productService
      .getProducts({
        ...currentFilters,
        department,
      })
      .then(({ products }) => {
        setProducts(products);
        setIsLoading(false);
      });
  }, [searchParams, department]);

  // Update URL Search Params when filters change
  const handleFilterChange = (newFilters) => {
    const updatedParams = new URLSearchParams();

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        if (key === 'inStockOnly') {
          if (value === true) updatedParams.set('inStock', 'true');
        } else if (Array.isArray(value)) {
          if (value.length > 0) updatedParams.set(key, value.join(','));
        } else {
          updatedParams.set(key, value);
        }
      }
    });

    setSearchParams(updatedParams);
  };

  const handleResetFilters = () => {
    const cleared = new URLSearchParams();
    // Keep search query if on search page
    if (currentFilters.search) {
      cleared.set('q', currentFilters.search);
    }
    setSearchParams(cleared);
  };

  const removeSingleFilter = (key, valToRemove = null) => {
    const updated = { ...currentFilters };
    if (valToRemove && updated[key]) {
      const arr = Array.isArray(updated[key]) ? updated[key] : updated[key].split(',');
      const remaining = arr.filter((item) => item !== valToRemove);
      updated[key] = remaining.length === 0 ? '' : remaining;
    } else {
      updated[key] = '';
    }
    handleFilterChange(updated);
  };

  // Count active filter criteria
  const activeFiltersCount = [
    currentFilters.category,
    currentFilters.brand,
    currentFilters.gender,
    currentFilters.minPrice,
    currentFilters.maxPrice,
    currentFilters.color,
    currentFilters.material,
    currentFilters.inStockOnly ? 'inStock' : '',
    currentFilters.minRating,
  ].filter(Boolean).length;

  const handleAddToCart = (product, variant, qty = 1) => {
    addItem(product, variant, qty);
    openCartDrawer();
  };

  return (
    <div className={`container ${styles.pageWrapper}`}>
      {/* Header & Breadcrumbs */}
      <div className={styles.header}>
        <nav className={styles.breadcrumb} aria-label="Fil d'ariane">
          <Link to="/">Accueil</Link>
          <ChevronRight size={12} />
          <span>{breadcrumbName}</span>
          {currentFilters.search && (
            <>
              <ChevronRight size={12} />
              <span>Recherche: "{currentFilters.search}"</span>
            </>
          )}
        </nav>

        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      {/* Controls Toolbar: Count, Mobile Trigger, Sorting */}
      <div className={styles.toolbar}>
        <span className={styles.countText}>
          {isLoading ? (
            'Recherche en cours...'
          ) : (
            <>
              <strong>{products.length}</strong> {products.length <= 1 ? 'pièce disponible' : 'pièces d’exception disponibles'}
            </>
          )}
        </span>

        <div className={styles.toolbarActions}>
          {/* Mobile Filter Toggle */}
          <button
            type="button"
            className={styles.mobileFilterBtn}
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="Ouvrir les filtres de sélection"
          >
            <SlidersHorizontal size={15} />
            <span>Filtres</span>
            {activeFiltersCount > 0 && (
              <span className={styles.mobileFilterBadge}>{activeFiltersCount}</span>
            )}
          </button>

          {/* Sorting Dropdown */}
          <div className={styles.sortSelector}>
            <label htmlFor="sort-select" className={styles.sortLabel}>
              Trier par :
            </label>
            <select
              id="sort-select"
              value={currentFilters.sort}
              onChange={(e) =>
                handleFilterChange({ ...currentFilters, sort: e.target.value })
              }
              className={styles.sortSelect}
            >
              {FILTER_OPTIONS.sort_options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Tag Pills */}
      {activeFiltersCount > 0 && (
        <div className={styles.activePillsRow}>
          <span className={styles.pillsLabel}>Filtres actifs :</span>

          {currentFilters.category && (
            <span className={styles.pill}>
              Catégorie: {currentFilters.category}
              <button
                type="button"
                className={styles.pillClose}
                onClick={() => removeSingleFilter('category')}
              >
                <X size={12} />
              </button>
            </span>
          )}

          {currentFilters.brand && (
            <span className={styles.pill}>
              Marque: {currentFilters.brand}
              <button
                type="button"
                className={styles.pillClose}
                onClick={() => removeSingleFilter('brand')}
              >
                <X size={12} />
              </button>
            </span>
          )}

          {currentFilters.gender && (
            <span className={styles.pill}>
              Genre: {currentFilters.gender}
              <button
                type="button"
                className={styles.pillClose}
                onClick={() => removeSingleFilter('gender')}
              >
                <X size={12} />
              </button>
            </span>
          )}

          {(currentFilters.minPrice || currentFilters.maxPrice) && (
            <span className={styles.pill}>
              Prix: {currentFilters.minPrice || 0} - {currentFilters.maxPrice || '∞'} FCFA
              <button
                type="button"
                className={styles.pillClose}
                onClick={() => {
                  removeSingleFilter('minPrice');
                  removeSingleFilter('maxPrice');
                }}
              >
                <X size={12} />
              </button>
            </span>
          )}

          {currentFilters.color && (
            <span className={styles.pill}>
              Couleur: {currentFilters.color}
              <button
                type="button"
                className={styles.pillClose}
                onClick={() => removeSingleFilter('color')}
              >
                <X size={12} />
              </button>
            </span>
          )}

          {currentFilters.material && (
            <span className={styles.pill}>
              Matière: {currentFilters.material}
              <button
                type="button"
                className={styles.pillClose}
                onClick={() => removeSingleFilter('material')}
              >
                <X size={12} />
              </button>
            </span>
          )}

          {currentFilters.inStockOnly && (
            <span className={styles.pill}>
              En stock uniquement
              <button
                type="button"
                className={styles.pillClose}
                onClick={() => removeSingleFilter('inStockOnly')}
              >
                <X size={12} />
              </button>
            </span>
          )}

          {currentFilters.minRating && (
            <span className={styles.pill}>
              Note: {currentFilters.minRating}★+
              <button
                type="button"
                className={styles.pillClose}
                onClick={() => removeSingleFilter('minRating')}
              >
                <X size={12} />
              </button>
            </span>
          )}

          <button
            type="button"
            className={styles.clearAllBtn}
            onClick={handleResetFilters}
          >
            Réinitialiser tout
          </button>
        </div>
      )}

      {/* Main Grid: Desktop Sticky Sidebar + Products List */}
      <div className={styles.layout}>
        <div className={styles.desktopSidebar}>
          <FilterSidebar
            filters={currentFilters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            department={department}
          />
        </div>

        {/* Mobile Filter Drawer */}
        <FilterSidebar
          filters={currentFilters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          department={department}
          isMobileDrawer={true}
          isOpen={isMobileDrawerOpen}
          onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
        />

        {/* Product Cards Grid Area */}
        <div className={styles.productsColumn}>
          {isLoading ? (
            <div className={styles.productGrid}>
              <SkeletonCard count={6} />
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="Aucun modèle ne correspond à vos critères"
              description="Essayez d'élargir vos filtres ou de modifier votre recherche pour découvrir nos autres pièces d'horlogerie et de joaillerie."
              actionText="Effacer tous les filtres"
              onAction={handleResetFilters}
            />
          ) : (
            <div className={styles.productGrid}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
