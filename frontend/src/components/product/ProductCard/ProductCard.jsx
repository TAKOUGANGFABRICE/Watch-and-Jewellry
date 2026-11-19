import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Tag, Truck, Star, Eye } from 'lucide-react';
import { formatFCFA } from '@/utils/currency';
import { useWishlist } from '@/context/WishlistContext';
import styles from './ProductCard.module.css';

export default function ProductCard({
  product,
  onAddToCart,
  onAddToWishlist,
  className = '',
  variant = 'default',
}) {
  const { isInWishlist, toggleWishlist: contextToggleWishlist } = useWishlist();

  if (!product) return null;

  const {
    id,
    name,
    brand = 'FARÉL Atelier',
    slug,
    sku,
    base_price = 0,
    price = base_price,
    original_price = null,
    discount_percentage = 0,
    department_type,
    category,
    category_name = category,
    images = [],
    primary_image,
    is_featured,
    is_new_arrival,
    is_on_sale,
    gender,
    rating = 0,
    review_count = 0,
    in_stock = true,
  } = product;

  const isWishlisted = isInWishlist(id);
  const imageUrl = primary_image || (images.length > 0 ? images[0].image : null);
  const detailLink = `/products/${slug || id}`;
  const hasDiscount = original_price && original_price > price;
  const discountPercent =
    discount_percentage ||
    (hasDiscount ? Math.round(((original_price - price) / original_price) * 100) : 0);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product, product.variants?.[0], 1);
    }
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    contextToggleWishlist(id);
    if (onAddToWishlist) {
      onAddToWishlist(product, !isWishlisted);
    }
  };

  const getAvailabilityText = () => {
    if (!in_stock) return { text: 'Rupture de stock', class: styles.availabilityOut };
    if (product.stock_quantity !== undefined && product.stock_quantity <= 3) {
      return { text: `Stock limité (${product.stock_quantity} restants)`, class: styles.availabilityLow };
    }
    return { text: 'En stock (Douala / Yaoundé)', class: styles.availabilityIn };
  };

  const availability = getAvailabilityText();

  return (
    <article className={`${styles.card} ${styles[`card${variant.charAt(0).toUpperCase() + variant.slice(1)}`]} ${className}`}>
      {/* Product Image & Badges */}
      <div className={styles.imageWrapper}>
        <Link to={detailLink} className={styles.imageLink} aria-label={`Voir ${name}`}>
          {imageUrl ? (
            <img src={imageUrl} alt={name} className={styles.image} loading="lazy" />
          ) : (
            <div className={styles.placeholder}>
              <span className={styles.placeholderText}>FARÉL</span>
              <span className={styles.departmentTag}>
                {department_type === 'WATCH' ? 'Horlogerie de Luxe' : 'Haute Joaillerie'}
              </span>
            </div>
          )}
        </Link>

        {/* Badges */}
        <div className={styles.badgeContainer}>
          {hasDiscount && (
            <span className={`${styles.badge} ${styles.badgeSale}`}>
              -{discountPercent}%
            </span>
          )}
          {is_new_arrival && (
            <span className={`${styles.badge} ${styles.badgeNew}`}>Nouveau</span>
          )}
          {is_featured && (
            <span className={`${styles.badge} ${styles.badgeGold}`}>Signature</span>
          )}
          {department_type && (
            <span className={`${styles.badge} ${styles.badgeDefault}`}>
              {department_type === 'WATCH' ? 'Montre' : 'Joaillerie'}
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlistActive : ''}`}
          aria-label={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          title={isWishlisted ? 'Dans vos favoris' : 'Ajouter aux favoris'}
        >
          <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Quick Actions Overlay (Desktop hover / Mobile inline) */}
        <div className={styles.actionOverlay}>
          {in_stock ? (
            <button
              type="button"
              onClick={handleQuickAdd}
              className={styles.quickAdd}
              title="Ajouter immédiatement au panier"
            >
              <ShoppingBag size={14} />
              <span>Ajouter</span>
            </button>
          ) : null}

          <Link
            to={detailLink}
            className={styles.viewDetailsBtn}
            title="Consulter les caractéristiques complètes"
          >
            <Eye size={14} />
            <span>Voir détails</span>
          </Link>
        </div>

        {!in_stock && (
          <div className={styles.outOfStockOverlay}>
            <span>Épuisé</span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className={styles.info}>
        <div className={styles.header}>
          <span className={styles.brand}>{brand}</span>
          {gender && <span className={styles.gender}>{gender}</span>}
        </div>

        <Link to={detailLink} className={styles.titleLink}>
          <h3 className={styles.title}>{name}</h3>
        </Link>

        {category_name && (
          <span className={styles.category}>{category_name}</span>
        )}

        {/* Price Row: Current Price, Original Price, and Discount */}
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatFCFA(price)}</span>
          {hasDiscount && (
            <>
              <span className={styles.originalPrice}>{formatFCFA(original_price)}</span>
              <span className={styles.discountBadge}>Économisez {discountPercent}%</span>
            </>
          )}
        </div>

        {/* Ratings Breakdown */}
        {(rating > 0 || review_count > 0) && (
          <div className={styles.rating}>
            <Star size={13} className={styles.star} />
            <span className={styles.ratingValue}>{rating.toFixed(1)}</span>
            <span className={styles.reviewCount}>({review_count} avis)</span>
          </div>
        )}

        {/* Availability Status */}
        <div className={`${styles.availability} ${availability.class}`}>
          <Truck size={12} />
          <span>{availability.text}</span>
        </div>

        {sku && (
          <span className={styles.sku}>
            <Tag size={10} /> Réf: {sku}
          </span>
        )}

        {/* Explicit View Details Link in Card Body */}
        <div className={styles.cardFooter}>
          <Link to={detailLink} className={styles.footerDetailsLink}>
            Détails & Spécifications →
          </Link>
        </div>
      </div>
    </article>
  );
}
