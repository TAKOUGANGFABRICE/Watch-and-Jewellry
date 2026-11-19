import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { formatFCFA } from '@/utils/currency';
import Button from '@/components/common/Button/Button';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (product) => {
    addToCart(product, 1);
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: 'var(--space-xs)' }}>
          Ma Liste de Souhaits ({wishlist.length})
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-muted-grey)' }}>
          Vos pièces d'exception favorites soigneusement conservées pour vos futures commandes.
        </p>
      </div>

      {wishlist.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            border: '1px dashed var(--color-border-grey)',
            backgroundColor: 'var(--color-cream-subtle)',
          }}
        >
          <Heart size={36} style={{ color: 'var(--color-champagne-gold)', marginBottom: 'var(--space-sm)' }} />
          <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: 'var(--space-xs)' }}>
            Votre liste de souhaits est vide
          </h4>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-muted-grey)', marginBottom: 'var(--space-lg)' }}>
            Explorez notre collection et cliquez sur le cœur pour mémoriser les montres et bijoux qui vous inspirent.
          </p>
          <Link to="/catalog">
            <Button variant="primary" size="md">
              Découvrir les Collections
            </Button>
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--space-lg)',
          }}
        >
          {wishlist.map((item) => (
            <div
              key={item.id}
              style={{
                border: '1px solid var(--color-border-grey)',
                backgroundColor: 'var(--color-white)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ position: 'relative' }}>
                <Link to={`/products/${item.slug || item.id}`}>
                  <img
                    src={item.image || item.primary_image || '/placeholder-watch.jpg'}
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '240px',
                      objectFit: 'cover',
                      backgroundColor: 'var(--color-cream-subtle)',
                    }}
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => removeFromWishlist(item.id)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--color-charcoal)',
                  }}
                  title="Retirer de la liste"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ padding: 'var(--space-md)' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted-grey)' }}>
                  {item.brand || 'FARÉL'}
                </span>
                <h4 style={{ fontSize: '0.95rem', margin: '4px 0 8px 0', fontFamily: 'var(--font-serif)' }}>
                  <Link to={`/products/${item.slug || item.id}`} style={{ color: 'var(--color-charcoal)' }}>
                    {item.name}
                  </Link>
                </h4>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 'var(--space-md)' }}>
                  {formatFCFA(item.price || item.base_price)}
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => handleAddToCart(item)}
                >
                  <ShoppingBag size={14} style={{ marginRight: '6px' }} />
                  Ajouter au Panier
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
