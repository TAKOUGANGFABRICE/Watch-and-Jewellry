import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import orderService from '@/services/orderService';
import { formatFCFA } from '@/utils/currency';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Loading/Spinner';
import { Package, ChevronRight, Eye } from 'lucide-react';

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const data = await orderService.getMyOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching my orders:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const getPaymentStatusBadge = (status) => {
    const isPaid = status === 'PAID';
    return (
      <span
        style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          padding: '3px 8px',
          backgroundColor: isPaid ? 'rgba(46, 125, 50, 0.12)' : 'rgba(217, 119, 6, 0.12)',
          color: isPaid ? 'var(--color-success)' : 'var(--color-warning)',
        }}
      >
        {isPaid ? 'RÉGLÉ' : 'EN ATTENTE DE PAIEMENT'}
      </span>
    );
  };

  const getFulfillmentBadge = (status) => {
    const labels = {
      UNFULFILLED: 'En attente de traitement',
      PROCESSING: 'Inspection & Préparation Luxe',
      DISPATCHED_TO_AGENCY: 'Expédié en Agence VIP',
      OUT_FOR_DELIVERY: 'En cours de livraison coursier',
      DELIVERED: 'Livré au destinataire',
      CANCELLED: 'Annulé',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: 'var(--space-xs)' }}>
          Historique de Mes Commandes
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-muted-grey)' }}>
          Retrouvez le suivi en direct et le détail de vos acquisitions FARÉL.
        </p>
      </div>

      {orders.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            border: '1px dashed var(--color-border-grey)',
            backgroundColor: 'var(--color-cream-subtle)',
          }}
        >
          <Package size={36} style={{ color: 'var(--color-champagne-gold)', marginBottom: 'var(--space-sm)' }} />
          <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: 'var(--space-xs)' }}>
            Vous n'avez pas encore passé de commande
          </h4>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-muted-grey)', marginBottom: 'var(--space-lg)' }}>
            Découvrez nos créations exclusives de montres d'exception et de haute joaillerie.
          </p>
          <Link to="/catalog">
            <Button variant="primary" size="md">
              Explorer le Catalogue
            </Button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {orders.map((ord) => {
            const formattedDate = ord.created_at
              ? new Date(ord.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—';

            return (
              <div
                key={ord.order_number}
                style={{
                  border: '1px solid var(--color-border-grey)',
                  padding: 'var(--space-lg)',
                  backgroundColor: 'var(--color-white)',
                  transition: 'box-shadow var(--transition-fast)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-sm)',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--color-charcoal)' }}>
                      {ord.order_number}
                    </strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-muted-grey)', marginLeft: '12px' }}>
                      Commandé le {formattedDate}
                    </span>
                  </div>
                  <div>{getPaymentStatusBadge(ord.payment_status)}</div>
                </div>

                <div
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--color-charcoal)',
                    marginBottom: 'var(--space-md)',
                  }}
                >
                  Statut logistique : <strong>{getFulfillmentBadge(ord.fulfillment_status)}</strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--color-border-grey)',
                    paddingTop: 'var(--space-md)',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>
                    Total : {formatFCFA(ord.total_amount)}
                  </span>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Link to={`/track-order/${ord.order_number}`}>
                      <Button variant="outline" size="sm">
                        Suivi en Direct
                      </Button>
                    </Link>
                    <Link to={`/account/orders/${ord.order_number}`}>
                      <Button variant="primary" size="sm">
                        <Eye size={14} style={{ marginRight: '6px' }} />
                        Détails
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
