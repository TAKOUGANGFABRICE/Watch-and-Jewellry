import React from 'react';
import { formatFCFA } from '@/utils/currency';
import Button from '@/components/common/Button/Button';
import styles from '../AdminDashboardPage/AdminDashboardPage.module.css';

export default function AdminOrdersPage() {
  const orders = [
    {
      id: 'FRL-2026-9812A',
      date: '10/11/2026 14:20',
      customer: 'Samuel Eto',
      phone: '+237 690 12 34 56',
      city: 'Douala (Bonapriso)',
      amount: 385000,
      payment: 'MTN Mobile Money',
      paymentStatus: 'PAID',
      fulfillment: 'OUT_FOR_DELIVERY',
    },
    {
      id: 'FRL-2026-8842K',
      date: '10/11/2026 11:05',
      customer: 'Christian Mbida',
      phone: '+237 677 33 44 55',
      city: 'Yaoundé (Bastos)',
      amount: 495000,
      payment: 'Orange Money',
      paymentStatus: 'PAID',
      fulfillment: 'DISPATCHED_TO_AGENCY',
    },
    {
      id: 'FRL-2026-7731M',
      date: '09/11/2026 18:45',
      customer: 'Nadine Fotso',
      phone: '+237 699 88 77 66',
      city: 'Bafoussam (Agence Buca)',
      amount: 650000,
      payment: 'Visa Card',
      paymentStatus: 'PAID',
      fulfillment: 'PROCESSING',
    },
  ];

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Gestion des Commandes Clients au Cameroun</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm">Filtrer par Ville</Button>
          <Button variant="outline" size="sm">Exporter XLSX</Button>
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Commande</th>
            <th>Date & Heure</th>
            <th>Client</th>
            <th>Téléphone WhatsApp</th>
            <th>Lieu de Livraison</th>
            <th>Montant (FCFA)</th>
            <th>Paiement</th>
            <th>Fulfillment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((ord) => (
            <tr key={ord.id}>
              <td><strong>{ord.id}</strong></td>
              <td>{ord.date}</td>
              <td style={{ fontWeight: 600 }}>{ord.customer}</td>
              <td>{ord.phone}</td>
              <td>{ord.city}</td>
              <td style={{ fontWeight: 700 }}>{formatFCFA(ord.amount)}</td>
              <td>
                <span className={`${styles.statusBadge} ${styles.paidBadge}`}>
                  {ord.payment}
                </span>
              </td>
              <td>
                <span className={`${styles.statusBadge} ${styles.transitBadge}`}>
                  {ord.fulfillment}
                </span>
              </td>
              <td>
                <Button variant="ghost" size="sm">Fiche Colis</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

