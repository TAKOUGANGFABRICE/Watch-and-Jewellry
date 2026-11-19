import React from 'react';
import { formatFCFA } from '@/utils/currency';
import Button from '@/components/common/Button/Button';
import styles from './AdminDashboardPage.module.css';

export default function AdminDashboardPage() {
  const recentOrders = [
    {
      id: 'FRL-2026-9812A',
      customer: 'Samuel Eto (+237 690 12 34 56)',
      city: 'Douala (Bonapriso)',
      amount: 385000,
      payment: 'MTN MoMo',
      paymentStatus: 'PAID',
      fulfillment: 'En cours de coursier',
    },
    {
      id: 'FRL-2026-8842K',
      customer: 'Christian Mbida (+237 677 33 44 55)',
      city: 'Yaoundé (Bastos)',
      amount: 495000,
      payment: 'Orange Money',
      paymentStatus: 'PAID',
      fulfillment: 'Expédié Touristique Mvan',
    },
    {
      id: 'FRL-2026-7731M',
      customer: 'Nadine Fotso (+237 699 88 77 66)',
      city: 'Bafoussam',
      amount: 650000,
      payment: 'Carte Visa',
      paymentStatus: 'PAID',
      fulfillment: 'En préparation showroom',
    },
  ];

  return (
    <div>
      {/* KPI Cards Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Chiffre d'Affaires (Mois)</span>
          <span className={styles.kpiValue}>14 850 000 FCFA</span>
          <span className={styles.kpiSub}>+18.4% vs mois précédent</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Commandes Traitées</span>
          <span className={styles.kpiValue}>38</span>
          <span className={styles.kpiSub}>Taux de conversion MoMo : 94%</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Expéditions en Transit</span>
          <span className={styles.kpiValue}>6</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-muted-grey)' }}>
            4 Douala/Ydé, 2 Agences Buca/Touristique
          </span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Alertes Stock Faible</span>
          <span className={`${styles.kpiValue} ${styles.kpiWarning}`}>2</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-error)' }}>
            Réapprovisionnement requis
          </span>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Commandes Récentes (Cameroun)</h2>
          <Button to="/admin/orders" variant="outline" size="sm">
            Voir Toutes les Commandes
          </Button>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Référence</th>
              <th>Client & Contact</th>
              <th>Destination</th>
              <th>Montant</th>
              <th>Mode Paiement</th>
              <th>Statut Expédition</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((ord) => (
              <tr key={ord.id}>
                <td><strong>{ord.id}</strong></td>
                <td>{ord.customer}</td>
                <td>{ord.city}</td>
                <td style={{ fontWeight: 600 }}>{formatFCFA(ord.amount)}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles.paidBadge}`}>
                    {ord.payment} (Payé)
                  </span>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${styles.transitBadge}`}>
                    {ord.fulfillment}
                  </span>
                </td>
                <td>
                  <Button variant="ghost" size="sm">Gérer</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

