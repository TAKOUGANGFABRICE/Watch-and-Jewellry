import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Truck,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Heart,
  Star,
  Tag,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import Button from '@/components/common/Button/Button';
import ProductGallery from '@/components/product/ProductGallery/ProductGallery';
import ProductCard from '@/components/product/ProductCard/ProductCard';
import SectionHeading from '@/components/common/SectionHeading/SectionHeading';
import Spinner from '@/components/common/Loading/Spinner';
import EmptyState from '@/components/common/Loading/EmptyState';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useUI } from '@/context/UIContext';
import { formatFCFA } from '@/utils/currency';
import productService from '@/services/productService';
import styles from './ProductDetailPage.module.css';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { openCartDrawer } = useUI();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active user selections
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'specs' | 'reviews' | 'delivery'

  // New review form state
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Fetch product data and related items
  useEffect(() => {
    setIsLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    productService.getProductBySlug(slug).then((prod) => {
      if (prod) {
        setProduct(prod);
        setSelectedVariant(prod.variants?.[0] || null);
        setQuantity(1);

        // Load reviews & related products
        productService.getReviews(prod.id).then((revs) => setReviews(revs));
        productService.getRelatedProducts(prod.id).then((rel) => setRelatedProducts(rel));
      }
      setIsLoading(false);
    });
  }, [slug]);

  if (isLoading) {
    return <Spinner fullPage text="Chargement de la pièce d'exception..." />;
  }

  if (!product) {
    return (
      <div className={`container ${styles.pageWrapper}`}>
        <EmptyState
          title="Modèle introuvable"
          description="Cette montre ou création joaillère n'est plus disponible dans nos collections."
          actionText="Retour aux Collections"
          actionTo="/watches"
        />
      </div>
    );
  }

  // Active variant pricing & attributes
  const currentPrice = selectedVariant?.price || product.price || product.base_price;
  const currentOriginalPrice = selectedVariant?.original_price || product.original_price;
  const hasDiscount = currentOriginalPrice && currentOriginalPrice > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
    : 0;

  const activeSku = selectedVariant?.sku || product.sku || 'FRL-PIECE';
  const isWishlisted = isInWishlist(product.id);

  // Stock status of currently selected variant
  const isVariantInStock = selectedVariant
    ? selectedVariant.in_stock && selectedVariant.stock_quantity > 0
    : product.in_stock !== false;
  const stockQty = selectedVariant?.stock_quantity ?? product.stock_quantity ?? 5;

  const handleAddToCart = () => {
    addItem(product, selectedVariant, quantity);
    openCartDrawer();
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;

    const created = await productService.addReview(product.id, {
      author: newReviewAuthor,
      rating: newReviewRating,
      title: newReviewTitle,
      comment: newReviewComment,
    });

    setReviews([created, ...reviews]);
    setReviewSubmitted(true);
    setNewReviewAuthor('');
    setNewReviewTitle('');
    setNewReviewComment('');
  };

  return (
    <div className={`container ${styles.pageWrapper}`}>
      {/* 1. Breadcrumbs */}
      <nav className={styles.breadcrumb} aria-label="Fil d'ariane">
        <Link to="/">Accueil</Link>
        <ChevronRight size={12} />
        <Link to={product.department_type === 'WATCH' ? '/watches' : '/jewellery'}>
          {product.department_type === 'WATCH' ? 'Horlogerie' : 'Haute Joaillerie'}
        </Link>
        <ChevronRight size={12} />
        {product.category && (
          <>
            <Link
              to={`/${product.department_type === 'WATCH' ? 'watches' : 'jewellery'}?category=${encodeURIComponent(
                product.category_slug || product.category
              )}`}
            >
              {product.category}
            </Link>
            <ChevronRight size={12} />
          </>
        )}
        <span className={styles.breadcrumbCurrent}>{product.name}</span>
      </nav>

      {/* 2. Main Product Presentation Grid */}
      <div className={styles.grid}>
        {/* Left: Interactive Image Gallery */}
        <ProductGallery
          images={product.images || [{ id: '1', image: product.primary_image }]}
          productName={product.name}
          badges={[
            hasDiscount ? { text: `-${discountPercent}%`, className: styles.discountBadge } : null,
            product.is_featured ? { text: 'Signature', className: styles.brand } : null,
          ].filter(Boolean)}
        />

        {/* Right: Product Details & Purchase Actions */}
        <div className={styles.details}>
          <div className={styles.brandRow}>
            <span className={styles.brand}>{product.brand}</span>
            <span className={styles.sku}>
              <Tag size={12} /> Réf: {activeSku}
            </span>
          </div>

          <h1 className={styles.title}>{product.name}</h1>

          {/* Rating Summary */}
          <div className={styles.ratingRow}>
            <div className={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={15}
                  fill={i < Math.floor(product.rating || 5) ? 'currentColor' : 'none'}
                  stroke={i < Math.floor(product.rating || 5) ? 'currentColor' : '#ccc'}
                />
              ))}
            </div>
            <span className={styles.ratingNumber}>{(product.rating || 5).toFixed(1)}/5</span>
            <button
              type="button"
              className={styles.reviewLink}
              onClick={() => {
                setActiveTab('reviews');
                document.getElementById('product-tabs-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              ({reviews.length} avis clients certifiés)
            </button>
          </div>

          {/* Price & Discounts */}
          <div className={styles.priceSection}>
            <span className={styles.currentPrice}>{formatFCFA(currentPrice)}</span>
            {hasDiscount && (
              <>
                <span className={styles.originalPrice}>{formatFCFA(currentOriginalPrice)}</span>
                <span className={styles.discountBadge}>Économisez {discountPercent}%</span>
              </>
            )}
          </div>

          {/* Stock Availability */}
          <div className={styles.stockStatus}>
            {isVariantInStock ? (
              stockQty <= 3 ? (
                <span className={styles.stockLow}>
                  <AlertTriangle size={15} />
                  Stock limité : plus que {stockQty} pièces disponibles à Douala & Yaoundé
                </span>
              ) : (
                <span className={styles.stockIn}>
                  <CheckCircle2 size={15} />
                  En stock : disponible immédiatement pour expédition
                </span>
              )
            ) : (
              <span className={styles.stockOut}>
                <AlertTriangle size={15} />
                Rupture temporaire de stock — Disponible sur commande privée
              </span>
            )}
          </div>

          {/* Short Description */}
          <p className={styles.shortDesc}>{product.short_description}</p>

          {/* Material Highlight */}
          {product.materials && product.materials.length > 0 && (
            <div className={styles.optionBlock}>
              <span className={styles.optionTitle}>
                Matières & Métaux Précieux :{' '}
                <span className={styles.optionValue}>{product.materials.join(', ')}</span>
              </span>
            </div>
          )}

          {/* Available Colours / Metal Finishes */}
          {product.colors && product.colors.length > 0 && (
            <div className={styles.optionBlock}>
              <span className={styles.optionTitle}>
                Teinte & Finition :{' '}
                <span className={styles.optionValue}>
                  {selectedVariant?.attributes?.dial_color ||
                    selectedVariant?.attributes?.metal_color ||
                    product.colors[0]}
                </span>
              </span>
              <div className={styles.variantGrid}>
                {product.colors.map((colorName) => (
                  <span
                    key={colorName}
                    className={`${styles.variantBtn} ${
                      (selectedVariant?.attributes?.dial_color === colorName ||
                        selectedVariant?.attributes?.metal_color === colorName)
                        ? styles.variantActive
                        : ''
                    }`}
                  >
                    {colorName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Variant Selector (Ring Sizes / Straps / Dimensions) */}
          {product.variants && product.variants.length > 0 && (
            <div className={styles.optionBlock}>
              <div className={styles.optionHeader}>
                <span className={styles.optionTitle}>
                  {product.department_type === 'WATCH' ? 'Option de Bracelet & Finition :' : 'Taille de Bague (Tour de doigt) :'}
                </span>
                {product.department_type === 'JEWELLERY' && (
                  <button
                    type="button"
                    className={styles.guideLink}
                    onClick={() => alert("Guide des tailles FARÉL : Mesurez le diamètre intérieur d'une de vos bagues en millimètres (ex: 17.2mm = Taille 54).")}
                  >
                    Guide des tailles
                  </button>
                )}
              </div>

              <div className={styles.variantGrid}>
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const isAvail = variant.in_stock && variant.stock_quantity > 0;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={!isAvail}
                      className={`${styles.variantBtn} ${isSelected ? styles.variantActive : ''} ${
                        !isAvail ? styles.variantDisabled : ''
                      }`}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      {variant.title} {!isAvail ? '(Épuisé)' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector & Purchase Actions */}
          <div className={styles.actionRow}>
            <div className={styles.qtyControl}>
              <button
                type="button"
                className={styles.qtyBtn}
                disabled={quantity <= 1 || !isVariantInStock}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Diminuer la quantité"
              >
                -
              </button>
              <span className={styles.qtyNum}>{quantity}</span>
              <button
                type="button"
                className={styles.qtyBtn}
                disabled={quantity >= stockQty || !isVariantInStock}
                onClick={() => setQuantity(Math.min(stockQty, quantity + 1))}
                aria-label="Augmenter la quantité"
              >
                +
              </button>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!isVariantInStock}
              onClick={handleAddToCart}
            >
              {isVariantInStock
                ? `Ajouter au Panier • ${formatFCFA(currentPrice * quantity)}`
                : 'Rupture de Stock'}
            </Button>

            {/* Wishlist Icon Button */}
            <button
              type="button"
              className={`${styles.wishlistActionBtn} ${isWishlisted ? styles.wishlistActionActive : ''}`}
              onClick={() => toggleWishlist(product.id)}
              aria-label={isWishlisted ? 'Retirer de la liste de souhaits' : 'Ajouter à la liste de souhaits'}
              title={isWishlisted ? 'Dans vos favoris' : 'Ajouter à vos favoris'}
            >
              <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Cameroon Logistics & Security Assurance Box */}
          <div className={styles.assuranceBox}>
            <div className={styles.assuranceItem}>
              <Truck size={20} />
              <div>
                <strong>Livraison Sécurisée au Cameroun :</strong>
                <br />
                Coursier privé 24h à Douala et Yaoundé. Expédition avec assurance en agences agréées (Touristique Express, Buca Voyages, Finexs) dans tout le Cameroun.
                Livraison <strong>offerte dès 150 000 FCFA</strong>.
              </div>
            </div>

            <div className={styles.assuranceItem}>
              <ShieldCheck size={20} />
              <div>
                <strong>Authenticité & Poinçons d'État :</strong>
                <br />
                Poinçon de maître 18k (750/1000) et certificat officiel GIA pour chaque diamant naturel. Mouvements horlogers suisses garantis 3 ans.
              </div>
            </div>

            <div className={styles.assuranceItem}>
              <CreditCard size={20} />
              <div>
                <strong>Paiements Locaux Sécurisés :</strong>
                <br />
                MTN Mobile Money, Orange Money et Cartes Bancaires (Visa / Mastercard) acceptés en FCFA (XAF).
              </div>
            </div>

            <div className={styles.assuranceItem}>
              <RotateCcw size={20} />
              <div>
                <strong>Échange & Retouche Gratuite :</strong>
                <br />
                Mise à taille de bague et ajustement de bracelet de montre offerts sous 14 jours dans nos showrooms de Douala Bonapriso et Yaoundé Bastos.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detailed Tabs Section: Description, Specifications, Reviews, Delivery */}
      <section id="product-tabs-section" className={styles.tabsContainer}>
        <div className={styles.tabButtons}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'description' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Description & Savoir-Faire
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'specs' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('specs')}
          >
            Spécifications Techniques
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Avis Clients ({reviews.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'delivery' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('delivery')}
          >
            Livraison & Retrait Cameroun
          </button>
        </div>

        {/* Tab 1: Full Description */}
        {activeTab === 'description' && (
          <div className={styles.tabContent}>
            <p style={{ marginBottom: 'var(--space-md)' }}>{product.description}</p>
            <p>
              Chaque garde-temps et chaque bijou FARÉL est conçu avec une attention méticuleuse portée aux détails.
              Nos maîtres artisans horlogers et joailliers sélectionnent les métaux précieux les plus purs et les
              pierres naturelles d'exception pour vous offrir une création faite pour traverser les générations.
            </p>
          </div>
        )}

        {/* Tab 2: Specifications Table */}
        {activeTab === 'specs' && (
          <div className={styles.tabContent}>
            <table className={styles.specsTable}>
              <tbody>
                <tr>
                  <th>Maison / Créateur</th>
                  <td>{product.brand}</td>
                </tr>
                <tr>
                  <th>Référence Modèle (SKU)</th>
                  <td>{activeSku}</td>
                </tr>
                <tr>
                  <th>Département</th>
                  <td>{product.department_type === 'WATCH' ? 'Horlogerie de Luxe' : 'Haute Joaillerie'}</td>
                </tr>
                <tr>
                  <th>Catégorie</th>
                  <td>{product.category || product.category_name}</td>
                </tr>
                {product.gender && (
                  <tr>
                    <th>Genre</th>
                    <td>{product.gender === 'Men' ? 'Homme' : product.gender === 'Women' ? 'Femme' : 'Unisexe'}</td>
                  </tr>
                )}
                {product.materials && (
                  <tr>
                    <th>Matières & Métaux</th>
                    <td>{product.materials.join(', ')}</td>
                  </tr>
                )}
                {product.department_specs &&
                  Object.entries(product.department_specs).map(([specKey, specVal]) => (
                    <tr key={specKey}>
                      <th>{specKey}</th>
                      <td>{specVal}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Customer Reviews */}
        {activeTab === 'reviews' && (
          <div className={styles.reviewsLayout}>
            {/* Left: Score Breakdown */}
            <div className={styles.reviewsSummary}>
              <span className={styles.bigRating}>{(product.rating || 5).toFixed(1)}</span>
              <div className={styles.stars} style={{ justifyContent: 'center' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={i < Math.floor(product.rating || 5) ? 'currentColor' : 'none'}
                    stroke={i < Math.floor(product.rating || 5) ? 'currentColor' : '#ccc'}
                  />
                ))}
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--color-muted-grey)' }}>
                Basé sur {reviews.length} témoignages vérifiés d'acheteurs au Cameroun.
              </p>
            </div>

            {/* Right: Reviews List & Submission Form */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: 'var(--space-md)' }}>
                Témoignages Clients Vérifiés
              </h3>

              {reviews.length === 0 ? (
                <p style={{ color: 'var(--color-muted-grey)' }}>Soyez le premier à donner votre avis sur cette pièce.</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className={styles.reviewItem}>
                    <div className={styles.reviewHeader}>
                      <div>
                        <span className={styles.reviewAuthor}>{rev.author}</span>
                        {rev.verified_purchase && (
                          <span className={styles.verifiedBadge}>✓ Achat Vérifié</span>
                        )}
                      </div>
                      <span className={styles.reviewDate}>{rev.date}</span>
                    </div>

                    <div className={styles.stars}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          fill={i < rev.rating ? 'currentColor' : 'none'}
                          stroke={i < rev.rating ? 'currentColor' : '#ccc'}
                        />
                      ))}
                    </div>

                    <h4 className={styles.reviewTitle}>{rev.title}</h4>
                    <p className={styles.reviewComment}>{rev.comment}</p>
                  </div>
                ))
              )}

              {/* Review Submission Form */}
              <form onSubmit={handleReviewSubmit} className={styles.reviewForm}>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem' }}>
                  Partager votre Expérience FARÉL
                </h4>

                {reviewSubmitted && (
                  <p style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                    ✓ Merci pour votre retour précieux ! Votre avis a été enregistré avec succès.
                  </p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Votre Nom
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Alain N."
                      value={newReviewAuthor}
                      onChange={(e) => setNewReviewAuthor(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border-grey)' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Note
                    </label>
                    <select
                      value={newReviewRating}
                      onChange={(e) => setNewReviewRating(Number(e.target.value))}
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border-grey)' }}
                    >
                      <option value="5">5 Étoiles - Exceptionnel</option>
                      <option value="4">4 Étoiles - Très Satisfait</option>
                      <option value="3">3 Étoiles - Conforme</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Titre de votre Avis
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Finition remarquable et livraison rapide"
                    value={newReviewTitle}
                    onChange={(e) => setNewReviewTitle(e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border-grey)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Votre Commentaire
                  </label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Décrivez votre expérience avec la pièce et le service FARÉL..."
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border-grey)', fontFamily: 'var(--font-sans)' }}
                  />
                </div>

                <Button type="submit" variant="primary" size="md">
                  Publier mon Témoignage
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 4: Cameroon Logistics & Delivery Info */}
        {activeTab === 'delivery' && (
          <div className={styles.tabContent}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2xl)' }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '8px' }}>
                  Livraison par Coursier Privé (Douala & Yaoundé)
                </h4>
                <p style={{ color: 'var(--color-charcoal)', lineHeight: 1.6 }}>
                  Nos coursiers dédiés livrent directement à votre domicile, bureau ou lieu de rendez-vous sous 24 heures.
                  Le colis est scellé et assuré à hauteur de sa valeur totale.
                </p>
                <p style={{ marginTop: '8px', color: 'var(--color-muted-grey)', fontSize: '0.88rem' }}>
                  • Douala : Bonapriso, Bonanjo, Akwa, Makepe, Denver, Kotto.<br />
                  • Yaoundé : Bastos, Golf, Omnisports, Santa Barbara, Mendong.
                </p>
              </div>

              <div>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '8px' }}>
                  Expédition en Régions (Bafoussam, Kribi, Garoua, etc.)
                </h4>
                <p style={{ color: 'var(--color-charcoal)', lineHeight: 1.6 }}>
                  Pour les autres villes du Cameroun, les commandes sont expédiées via nos partenaires de transport agréés :
                  <strong> Touristique Express</strong>, <strong>Buca Voyages</strong> et <strong>Finexs Voyages</strong>.
                </p>
                <p style={{ marginTop: '8px', color: 'var(--color-muted-grey)', fontSize: '0.88rem' }}>
                  Retrait sécurisé en agence sur présentation de votre CNI et du code SMS unique reçu après confirmation.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className={styles.relatedSection}>
          <SectionHeading
            eyebrow="Harmonie & Distinction"
            title="Vous Aimerez Également"
            description="Des pièces d'exception sélectionnées pour compléter votre parure ou votre collection horlogère."
          />

          <div className={styles.relatedGrid}>
            {relatedProducts.map((relProd) => (
              <ProductCard
                key={relProd.id}
                product={relProd}
                onAddToCart={(p, v, q) => addItem(p, v, q)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
