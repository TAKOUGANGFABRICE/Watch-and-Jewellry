import React from 'react';
import { SlidersHorizontal, X, Star } from 'lucide-react';
import Button from '@/components/common/Button/Button';
import { FILTER_OPTIONS } from '@/utils/mockData';
import styles from './FilterSidebar.module.css';

export default function FilterSidebar({
  filters = {},
  onFilterChange,
  onResetFilters,
  department = 'ALL',
  isMobileDrawer = false,
  isOpen = false,
  onCloseMobileDrawer,
}) {
  const categoriesForDept =
    department === 'WATCH'
      ? FILTER_OPTIONS.categories.WATCH
      : department === 'JEWELLERY'
      ? FILTER_OPTIONS.categories.JEWELLERY
      : [...FILTER_OPTIONS.categories.WATCH, ...FILTER_OPTIONS.categories.JEWELLERY];

  const handlePriceChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value === '' ? '' : Number(value),
    });
  };

  const handleCategoryToggle = (cat) => {
    const current = filters.category ? (Array.isArray(filters.category) ? filters.category : [filters.category]) : [];
    const updated = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    onFilterChange({
      ...filters,
      category: updated.length === 0 ? '' : updated.length === 1 ? updated[0] : updated,
    });
  };

  const handleBrandToggle = (b) => {
    const current = filters.brand ? (Array.isArray(filters.brand) ? filters.brand : [filters.brand]) : [];
    const updated = current.includes(b)
      ? current.filter((item) => item !== b)
      : [...current, b];
    onFilterChange({
      ...filters,
      brand: updated.length === 0 ? '' : updated.length === 1 ? updated[0] : updated,
    });
  };

  const handleGenderToggle = (g) => {
    onFilterChange({
      ...filters,
      gender: filters.gender === g ? '' : g,
    });
  };

  const handleColorToggle = (c) => {
    const current = filters.color ? (Array.isArray(filters.color) ? filters.color : [filters.color]) : [];
    const updated = current.includes(c)
      ? current.filter((item) => item !== c)
      : [...current, c];
    onFilterChange({
      ...filters,
      color: updated.length === 0 ? '' : updated.length === 1 ? updated[0] : updated,
    });
  };

  const handleMaterialToggle = (m) => {
    const current = filters.material ? (Array.isArray(filters.material) ? filters.material : [filters.material]) : [];
    const updated = current.includes(m)
      ? current.filter((item) => item !== m)
      : [...current, m];
    onFilterChange({
      ...filters,
      material: updated.length === 0 ? '' : updated.length === 1 ? updated[0] : updated,
    });
  };

  const content = (
    <>
      <div className={styles.sidebarHeader}>
        <span className={styles.headerTitle}>
          <SlidersHorizontal size={18} />
          <span>Filtres de Sélection</span>
        </span>
        <button
          type="button"
          onClick={onResetFilters}
          className={styles.resetBtn}
          title="Réinitialiser tous les critères de recherche"
        >
          Tout Effacer
        </button>
      </div>

      {/* 1. Price Range Filter (in FCFA) */}
      <div className={styles.filterGroup}>
        <span className={styles.groupTitle}>Prix (FCFA)</span>
        <div className={styles.priceInputs}>
          <div className={styles.priceField}>
            <span className={styles.priceLabel}>Min</span>
            <input
              type="number"
              placeholder="0"
              value={filters.minPrice || ''}
              onChange={(e) => handlePriceChange('minPrice', e.target.value)}
              className={styles.priceInput}
              step="50000"
            />
          </div>
          <span style={{ color: 'var(--color-muted-grey)', marginTop: '16px' }}>—</span>
          <div className={styles.priceField}>
            <span className={styles.priceLabel}>Max</span>
            <input
              type="number"
              placeholder="2 000 000"
              value={filters.maxPrice || ''}
              onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
              className={styles.priceInput}
              step="50000"
            />
          </div>
        </div>
      </div>

      {/* 2. Category Filter */}
      <div className={styles.filterGroup}>
        <span className={styles.groupTitle}>Catégorie</span>
        <div className={styles.optionList}>
          {categoriesForDept.map((cat) => {
            const isChecked = filters.category && (
              Array.isArray(filters.category)
                ? filters.category.includes(cat)
                : filters.category === cat
            );
            return (
              <label key={cat} className={styles.optionLabel}>
                <input
                  type="checkbox"
                  checked={Boolean(isChecked)}
                  onChange={() => handleCategoryToggle(cat)}
                  className={styles.checkbox}
                />
                <span>{cat}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Brand Filter */}
      <div className={styles.filterGroup}>
        <span className={styles.groupTitle}>Marque / Maison</span>
        <div className={styles.optionList}>
          {FILTER_OPTIONS.brands.map((b) => {
            const isChecked = filters.brand && (
              Array.isArray(filters.brand)
                ? filters.brand.includes(b)
                : filters.brand === b
            );
            return (
              <label key={b} className={styles.optionLabel}>
                <input
                  type="checkbox"
                  checked={Boolean(isChecked)}
                  onChange={() => handleBrandToggle(b)}
                  className={styles.checkbox}
                />
                <span>{b}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Gender Filter */}
      <div className={styles.filterGroup}>
        <span className={styles.groupTitle}>Genre / Public</span>
        <div className={styles.optionList}>
          {[
            { label: 'Homme', val: 'Men' },
            { label: 'Femme', val: 'Women' },
            { label: 'Unisexe', val: 'Unisex' },
          ].map((item) => (
            <label key={item.val} className={styles.optionLabel}>
              <input
                type="radio"
                name="genderFilter"
                checked={filters.gender === item.val}
                onChange={() => handleGenderToggle(item.val)}
                className={styles.checkbox}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 5. Colours Filter */}
      <div className={styles.filterGroup}>
        <span className={styles.groupTitle}>Couleur / Teinte</span>
        <div className={styles.swatchGrid}>
          {['Or Jaune', 'Or Blanc', 'Or Rose', 'Bleu Nuit', 'Noir', 'Argent', 'Vert Forêt'].map((col) => {
            const isActive = filters.color && (
              Array.isArray(filters.color)
                ? filters.color.includes(col)
                : filters.color === col
            );
            return (
              <button
                key={col}
                type="button"
                className={`${styles.swatchBtn} ${isActive ? styles.swatchActive : ''}`}
                onClick={() => handleColorToggle(col)}
              >
                {col}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Material Filter */}
      <div className={styles.filterGroup}>
        <span className={styles.groupTitle}>Matières & Métaux</span>
        <div className={styles.optionList}>
          {[
            'Or 18K (750/1000)',
            'Diamant Naturel Certifié GIA',
            'Acier inoxydable 316L',
            'Verre Saphir',
            'Cuir Alligator',
            'Céramique',
            'Onyx Naturel',
          ].map((mat) => {
            const isChecked = filters.material && (
              Array.isArray(filters.material)
                ? filters.material.includes(mat)
                : filters.material === mat
            );
            return (
              <label key={mat} className={styles.optionLabel}>
                <input
                  type="checkbox"
                  checked={Boolean(isChecked)}
                  onChange={() => handleMaterialToggle(mat)}
                  className={styles.checkbox}
                />
                <span>{mat}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 7. Availability Filter */}
      <div className={styles.filterGroup}>
        <span className={styles.groupTitle}>Disponibilité</span>
        <label className={styles.optionLabel}>
          <input
            type="checkbox"
            checked={Boolean(filters.inStockOnly)}
            onChange={(e) => onFilterChange({ ...filters, inStockOnly: e.target.checked })}
            className={styles.checkbox}
          />
          <span>En stock uniquement (Douala & Yaoundé)</span>
        </label>
      </div>

      {/* 8. Minimum Customer Rating */}
      <div className={styles.filterGroup}>
        <span className={styles.groupTitle}>Avis & Évaluations</span>
        <div className={styles.optionList}>
          {[4, 3].map((stars) => (
            <label key={stars} className={styles.ratingOption}>
              <input
                type="radio"
                name="ratingFilter"
                checked={Number(filters.minRating) === stars}
                onChange={() => onFilterChange({
                  ...filters,
                  minRating: Number(filters.minRating) === stars ? '' : stars,
                })}
                className={styles.checkbox}
              />
              <div className={styles.starsRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < stars ? 'currentColor' : 'none'}
                    stroke={i < stars ? 'currentColor' : '#ccc'}
                  />
                ))}
              </div>
              <span style={{ fontSize: '0.8rem' }}>{stars}★ et plus</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );

  // If in mobile drawer mode
  if (isMobileDrawer) {
    if (!isOpen) return null;
    return (
      <div
        className={styles.mobileDrawerBackdrop}
        onClick={(e) => {
          if (e.target === e.currentTarget && onCloseMobileDrawer) onCloseMobileDrawer();
        }}
      >
        <div className={styles.mobileDrawer}>
          <div className={styles.mobileDrawerHeader}>
            <span className={styles.headerTitle}>Filtres</span>
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-charcoal)' }}
            >
              <X size={22} />
            </button>
          </div>

          <div className={styles.mobileDrawerBody}>{content}</div>

          <div className={styles.mobileDrawerFooter}>
            <Button variant="outline" size="md" fullWidth onClick={onResetFilters}>
              Réinitialiser
            </Button>
            <Button variant="primary" size="md" fullWidth onClick={onCloseMobileDrawer}>
              Appliquer les Filtres
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop sidebar mode
  return <aside className={styles.sidebar}>{content}</aside>;
}
