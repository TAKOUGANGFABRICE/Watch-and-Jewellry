import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderService from '@/services/orderService';
import { formatFCFA } from '@/utils/currency';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Loading/Spinner';
import { ArrowLeft, MapPin, Package, Clock, ShieldCheck, CheckCircle } from 'lucide-react';

export default function OrderDetailsPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDetail() {
      try {
        const data = await orderService.getMyOrderDetail(orderNumber);
        setOrder(data);
      } catch (err) {
        setError("Impossible de charger les détails de cette commande.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchDetail();
  }, [orderNumber]);

  if (isLoading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <Link to="/account/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-md)', color: 'var(--color-charcoal)' }}>
          <ArrowLeft size={16} />
          <span>Retour à mes commandes</span>
        </Link>
        <div style={{ padding: '40px', backgroundColor: 'var(--color-cream-subtle)', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-error)' }}>{error || "Commande introuvable."}</p>
        </div>
      </div>
    );
  }

  const isPaid = order.payment_status === 'PAID';

  return (
    <div>
      <Link to="/account/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-md)', color: 'var(--color-charcoal)', fontSize: '0.88rem' }}>
        <ArrowLeft size={16} />
        <span>Retour à l'historique des commandes</span>
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--color-charcoal)' }}>
            Commande #{order.order_number}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted-grey)' }}>
            Enregistrée le {new Date(order.created_at).toLocaleString('fr-FR')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to={`/track-order/${order.order_number}`}>
            <Button variant="outline" size="sm">
              Suivi en Direct
            </Button>
          </Link>
          {!isPaid && (
            <Link to={`/checkout?resume=${order.order_number}`}>
              <Button variant="primary" size="sm">
                Régler la Commande
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Grid: Items & Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--space-xl)' }}>
        <div>
          {/* Order Items Table */}
          <div style={{ border: '1px solid var(--color-border-grey)', backgroundColor: 'var(--color-white)', marginBottom: 'var(--space-lg)' }}>
            <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--color-border-grey)', fontWeight: 600 }}>
              Articles Commandés ({order.items?.length || 0})
            </div>
            <div>
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 'var(--space-md) var(--space-lg)',
                    borderBottom: '1px solid var(--color-border-grey)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                      {item.product_name}
                    </h4>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-muted-grey)' }}>
                      Variante : {item.variant_title} • SKU : {item.sku}
                    </span>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-charcoal)', marginTop: '4px' }}>
                      Quantité : <strong>{item.quantity}</strong> × {formatFCFA(item.unit_price)}
                    </div>
                  </div>
                  <strong style={{ fontSize: '1rem', color: 'var(--color-charcoal)' }}>
                    {formatFCFA(item.total_price)}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Snapshot */}
          {order.shipping_address && (
            <div style={{ border: '1px solid var(--color-border-grey)', padding: 'var(--space-lg)', backgroundColor: 'var(--color-cream-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>
                <MapPin size={18} style={{ color: 'var(--color-champagne-gold)' }} />
                <span>Adresse de Livraison au Cameroun</span>
              </div>
              <p style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                Destinataire : <strong>{order.shipping_address.recipient_name}</strong>
              </p>
              <p style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                Localisation : {order.shipping_address.neighborhood}, {order.shipping_address.city} ({order.shipping_address.region})
              </p>
              {order.shipping_address.landmark && (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-muted-grey)', marginBottom: '4px' }}>
                  Repère précis : {order.shipping_address.landmark}
                </p>
              )}
              {order.shipping_address.additional_instructions && (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-muted-grey)', marginBottom: '4px' }}>
                  Consignes : {order.shipping_address.additional_instructions}
                </p>
              )}
              <p style={{ fontSize: '0.85rem', color: 'var(--color-charcoal)', marginTop: '6px' }}>
                Téléphone de livraison : <strong>{order.shipping_address.primary_phone}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Right: Payment & Status Summary */}
        <div>
          <div style={{ border: '1px solid var(--color-border-grey)', padding: 'var(--space-lg)', backgroundColor: 'var(--color-white)', marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', marginBottom: 'var(--space-md)' }}>
              Récapitulatif Financier
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span>Sous-total articles :</span>
              <span>{formatFCFA(order.subtotal)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span>Frais de livraison :</span>
              <span>{Number(order.shipping_fee) === 0 ? 'Offerte (0 FCFA)' : formatFCFA(order.shipping_fee)}</span>
            </div>

            {Number(order.discount_amount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-success)' }}>
                <span>Remise privilège :</span>
                <span>-{formatFCFA(order.discount_amount)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-grey)', paddingTop: '12px', marginTop: '12px', fontWeight: 700, fontSize: '1.15rem' }}>
              <span>Montant Total :</span>
              <span style={{ color: 'var(--color-champagne-gold)' }}>{formatFCFA(order.total_amount)}</span>
            </div>

            <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--color-border-grey)' }}>
              <div style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                Statut du règlement :{' '}
                <strong style={{ color: isPaid ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {isPaid ? 'RÉGLÉ' : 'EN ATTENTE'}
                </strong>
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                Mode de livraison : <strong>{order.delivery_method}</strong>
              </div>
            </div>
          </div>

          {/* Audit History Log */}
          {order.status_history?.length > 0 && (
            <div style={{ border: '1px solid var(--color-border-grey)', padding: 'var(--space-lg)', backgroundColor: 'var(--color-cream-subtle)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
                Historique des Événements
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {order.status_history.map((hist, idx) => (
                  <div key={idx} style={{ fontSize: '0.82rem', borderLeft: '2px solid var(--color-champagne-gold)', paddingLeft: '8px' }}>
                    <div style={{ fontWeight: 600 }}>{hist.status}</div>
                    <div style={{ color: 'var(--color-muted-grey)' }}>{hist.comment}</div>
                    <div style={{ fontSize: '0.75rem', color: '#999' }}>{new Date(hist.created_at).toLocaleString('fr-FR')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
