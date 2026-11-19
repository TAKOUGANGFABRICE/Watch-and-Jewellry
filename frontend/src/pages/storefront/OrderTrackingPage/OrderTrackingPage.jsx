import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import orderService from '@/services/orderService';
import { formatFCFA } from '@/utils/currency';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Loading/Spinner';
import { Search, CheckCircle, Package, Truck, Home, ShieldCheck } from 'lucide-react';
import styles from './OrderTrackingPage.module.css';

export default function OrderTrackingPage() {
  const { orderNumber: paramOrderNumber } = useParams();
  const navigate = useNavigate();

  const [inputNumber, setInputNumber] = useState(paramOrderNumber || '');
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchTracking = async (ref) => {
    if (!ref) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await orderService.trackOrder(ref.trim());
      setOrder(data);
    } catch (err) {
      setOrder(null);
      setErrorMessage("Aucune commande trouvée avec cette référence. Veuillez vérifier votre saisie.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (paramOrderNumber) {
      setInputNumber(paramOrderNumber);
      fetchTracking(paramOrderNumber);
    }
  }, [paramOrderNumber]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputNumber.trim()) {
      navigate(`/track-order/${inputNumber.trim()}`, { replace: true });
      fetchTracking(inputNumber.trim());
    }
  };

  // Determine active step index (0, 1, 2, 3)
  const getStepProgress = (fulfillmentStatus) => {
    switch (fulfillmentStatus) {
      case 'UNFULFILLED':
        return 0;
      case 'PROCESSING':
        return 1;
      case 'DISPATCHED_TO_AGENCY':
      case 'OUT_FOR_DELIVERY':
        return 2;
      case 'DELIVERED':
        return 3;
      default:
        return 0;
    }
  };

  const activeStep = order ? getStepProgress(order.fulfillment_status) : 0;

  return (
    <div className={`container ${styles.pageWrapper}`}>
      {/* Tracking Search Bar */}
      <div className={styles.searchBox}>
        <h1 className={styles.title}>Suivi de Commande Privilège</h1>
        <p className={styles.subtitle}>
          Suivez en temps réel l'acheminement et la livraison sécurisée de votre colis au Cameroun.
        </p>

        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Saisissez votre référence (ex : FRL-2026-XXXXX)"
            value={inputNumber}
            onChange={(e) => setInputNumber(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" size="md">
            <Search size={16} style={{ marginRight: '6px' }} />
            Rechercher
          </Button>
        </form>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Spinner size="lg" />
        </div>
      )}

      {errorMessage && (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px', backgroundColor: 'rgba(211, 47, 47, 0.08)', borderLeft: '3px solid var(--color-error)', color: 'var(--color-error)', fontSize: '0.9rem' }}>
          {errorMessage}
        </div>
      )}

      {order && !isLoading && (
        <div className={styles.trackingCard}>
          <div className={styles.orderHeader}>
            <div>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-grey)' }}>
                Commande FARÉL
              </span>
              <h2 className={styles.orderNumber}>{order.order_number}</h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-muted-grey)', marginTop: '4px' }}>
                Enregistrée le {new Date(order.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  backgroundColor: order.payment_status === 'PAID' ? 'rgba(46, 125, 50, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                  color: order.payment_status === 'PAID' ? 'var(--color-success)' : 'var(--color-warning)',
                  marginBottom: '6px',
                }}
              >
                {order.payment_status === 'PAID' ? 'PAIEMENT CONFIRMÉ' : 'EN ATTENTE DE PAIEMENT'}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-champagne-gold)' }}>
                {formatFCFA(order.total_amount)}
              </div>
            </div>
          </div>

          {/* Luxury 4-Step Progress Timeline */}
          <div className={styles.timeline}>
            <div className={`${styles.timelineStep} ${activeStep >= 0 ? (activeStep > 0 ? styles.stepCompleted : styles.stepActive) : ''}`}>
              <div className={styles.stepIconBox}>
                <CheckCircle size={18} />
              </div>
              <div className={styles.stepTitle}>1. Validée</div>
              <div className={styles.stepDesc}>Commande enregistrée</div>
            </div>

            <div className={`${styles.timelineStep} ${activeStep >= 1 ? (activeStep > 1 ? styles.stepCompleted : styles.stepActive) : ''}`}>
              <div className={styles.stepIconBox}>
                <Package size={18} />
              </div>
              <div className={styles.stepTitle}>2. Préparation</div>
              <div className={styles.stepDesc}>Contrôle & Écrin Luxe</div>
            </div>

            <div className={`${styles.timelineStep} ${activeStep >= 2 ? (activeStep > 2 ? styles.stepCompleted : styles.stepActive) : ''}`}>
              <div className={styles.stepIconBox}>
                <Truck size={18} />
              </div>
              <div className={styles.stepTitle}>3. Expédition</div>
              <div className={styles.stepDesc}>Coursier / Agence VIP</div>
            </div>

            <div className={`${styles.timelineStep} ${activeStep >= 3 ? styles.stepCompleted : ''}`}>
              <div className={styles.stepIconBox}>
                <Home size={18} />
              </div>
              <div className={styles.stepTitle}>4. Livrée</div>
              <div className={styles.stepDesc}>Remis en mains propres</div>
            </div>
          </div>

          {/* Details & Items */}
          <div className={styles.detailsGrid}>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
                Destination de Livraison
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-charcoal)', lineHeight: 1.5 }}>
                Localité : <strong>{order.shipping_neighborhood}, {order.shipping_city}</strong>
                <br />
                Acheminement : <strong>{order.delivery_method}</strong>
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
                Articles Inclus ({order.items_summary?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {order.items_summary?.map((it, idx) => (
                  <div key={idx} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{it.quantity}x {it.product_name} ({it.variant_title})</span>
                    <strong>{formatFCFA(it.total_price)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
