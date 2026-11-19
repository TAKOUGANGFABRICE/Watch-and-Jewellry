import React from 'react';
import ProductCard from './ProductCard/ProductCard';
import styles from './ProductGrid.module.css';

export default function ProductGrid({
  products = [],
  onAddToCart,
  onAddToWishlist,
  variant = 'default',
  className = '',
  emptyMessage = 'Aucun produit trouvé',
  emptyDescription = 'Essayez de modifier vos filtres ou votre recherche.',
}) {
  if (!products.length) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🔍</div>
        <h3 className={styles.emptyTitle}>{emptyMessage}</h3>
        <p className={styles.emptyDescription}>{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.grid} ${className}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onAddToWishlist={onAddToWishlist}
          variant={variant}
        />
      ))}
    </div>
  );
}