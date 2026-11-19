import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatFCFA } from '@/utils/currency';
import Button from '@/components/common/Button/Button';
import EmptyState from '@/components/common/Loading/EmptyState';
import styles from './CartPage.module.css';

export default function CartPage() {
  const {
    items,
    subtotal,
    isFreeShipping,
    remainingForFreeShipping,
    updateQuantity,
    removeItem,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className={`container ${styles.pageWrapper}`}>
        <h1 className={styles.title}>Mon Panier</h1>
        <EmptyState
          icon={<ShoppingBag size={56} />}
          title="Votre panier est actuellement vide"
          description="Découvrez nos collections d'horlogerie et de joaillerie d'exception."
          actionText="Découvrir les Collections"
          actionTo="/watches"
        />
      </div>
    );
  }

  return (
    <div className={`container ${styles.pageWrapper}`}>
      <h1 className={styles.title}>Mon Panier d'Achat</h1>

      <div className={styles.layout}>
        {/* Items Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Prix Unitaire</th>
                <th>Quantité</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.variantId}>
                  <td>
                    <div className={styles.productCell}>
                      {item.image ? (
                        <img src={item.image} alt={item.productName} className={styles.productImg} />
                      ) : (
                        <div className={styles.productImg} style={{ background: '#eee' }} />
                      )}
                      <div>
                        <span className={styles.productBrand}>{item.brand}</span>
                        <h4 className={styles.productName}>{item.productName}</h4>
                        <span className={styles.productVariant}>{item.title}</span>
                      </div>
                    </div>
                  </td>
                  <td>{formatFCFA(item.price)}</td>
                  <td>
                    <div className={styles.qtyBox}>
                      <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>+</button>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatFCFA(item.price * item.quantity)}</td>
                  <td>
                    <button
                      onClick={() => removeItem(item.variantId)}
                      style={{ color: 'var(--color-error)', textDecoration: 'underline', fontSize: '0.8rem' }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Card */}
        <aside className={styles.summaryBox}>
          <h2 className={styles.summaryTitle}>Récapitulatif</h2>
          <div className={styles.summaryRow}>
            <span>Sous-total</span>
            <span>{formatFCFA(subtotal)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Livraison (Douala / Yaoundé)</span>
            <span>{isFreeShipping ? 'Offerte' : '2 000 FCFA'}</span>
          </div>

          {!isFreeShipping && (
            <p style={{ fontSize: '0.78rem', color: 'var(--color-champagne-gold)', lineHeight: 1.4 }}>
              Ajoutez {formatFCFA(remainingForFreeShipping)} d'articles pour bénéficier de la livraison gratuite.
            </p>
          )}

          <div className={styles.totalRow}>
            <span>Total Estimé</span>
            <span>{formatFCFA(isFreeShipping ? subtotal : subtotal + 2000)}</span>
          </div>

          <Button to="/checkout" variant="primary" size="lg" fullWidth>
            Passer à la Caisse (MoMo / OM)
          </Button>
          <Button to="/watches" variant="ghost" size="sm" fullWidth>
            Continuer mes Achats
          </Button>
        </aside>
      </div>
    </div>
  );
}

