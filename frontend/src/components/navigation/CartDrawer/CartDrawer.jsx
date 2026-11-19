import React from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useUI } from '@/context/UIContext';
import { formatFCFA } from '@/utils/currency';
import Button from '@/components/common/Button/Button';
import EmptyState from '@/components/common/Loading/EmptyState';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const {
    items,
    totalItems,
    subtotal,
    isFreeShipping,
    remainingForFreeShipping,
    freeShippingThreshold,
    updateQuantity,
    removeItem,
  } = useCart();
  const { isCartDrawerOpen, closeCartDrawer } = useUI();

  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isCartDrawerOpen ? styles.backdropOpen : ''}`}
        onClick={closeCartDrawer}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className={`${styles.drawer} ${isCartDrawerOpen ? styles.drawerOpen : ''}`}
        aria-label="Panier d'achat"
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Panier ({totalItems})</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeCartDrawer}
            aria-label="Fermer le panier"
          >
            <X size={22} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className={styles.shippingBar}>
          {isFreeShipping ? (
            <p><strong>Félicitations !</strong> Vous bénéficiez de la livraison offerte.</p>
          ) : (
            <p>
              Ajoutez <strong>{formatFCFA(remainingForFreeShipping)}</strong> pour profiter de la{' '}
              <strong>livraison offerte</strong> à Douala et Yaoundé.
            </p>
          )}
          <div className={styles.shippingProgress}>
            <div
              className={styles.shippingProgressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cart Item Content */}
        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={48} />}
            title="Votre panier est vide"
            description="Découvrez nos montres d'exception et notre haute joaillerie pour commencer votre sélection."
            actionText="Découvrir les Collections"
            actionTo="/watches"
            onAction={closeCartDrawer}
          />
        ) : (
          <div className={styles.itemsList}>
            {items.map((item) => (
              <div key={item.variantId} className={styles.item}>
                {item.image ? (
                  <img src={item.image} alt={item.productName} className={styles.itemImage} />
                ) : (
                  <div className={styles.itemImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'var(--color-champagne-gold)', fontWeight: 600 }}>FARÉL</span>
                  </div>
                )}

                <div className={styles.itemDetails}>
                  <span className={styles.itemBrand}>{item.brand}</span>
                  <h4 className={styles.itemName}>{item.productName}</h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-muted-grey)' }}>{item.title}</span>
                  <span className={styles.itemPrice}>{formatFCFA(item.price)}</span>

                  <div className={styles.itemControls}>
                    <div className={styles.qtyGroup}>
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        aria-label="Diminuer la quantité"
                      >
                        -
                      </button>
                      <span className={styles.qtyNumber}>{item.quantity}</span>
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        aria-label="Augmenter la quantité"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeItem(item.variantId)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drawer Bottom Bar */}
        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.subtotalRow}>
              <span className={styles.subtotalLabel}>Sous-total estimé</span>
              <span className={styles.subtotalAmount}>{formatFCFA(subtotal)}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-muted-grey)' }}>
              Frais de livraison calculés lors de l'étape de paiement.
            </p>

            <div className={styles.actions}>
              <Button
                to="/checkout"
                variant="primary"
                size="md"
                fullWidth
                onClick={closeCartDrawer}
              >
                Passer la Commande (MoMo / OM)
              </Button>
              <Button
                to="/cart"
                variant="dark-outline"
                size="sm"
                fullWidth
                onClick={closeCartDrawer}
              >
                Voir le Panier Complet
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

