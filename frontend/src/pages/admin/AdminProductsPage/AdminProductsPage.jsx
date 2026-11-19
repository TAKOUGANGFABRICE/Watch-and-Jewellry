import React from 'react';
import { formatFCFA } from '@/utils/currency';
import Button from '@/components/common/Button/Button';
import { MOCK_PRODUCTS } from '@/utils/mockData';
import styles from '../AdminDashboardPage/AdminDashboardPage.module.css';

export default function AdminProductsPage() {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Catalogue Montres & Joaillerie ({MOCK_PRODUCTS.length})</h2>
        <Button variant="primary" size="sm">+ Ajouter un Nouveau Produit</Button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Visuel</th>
            <th>Maison / Marque</th>
            <th>Nom du Produit</th>
            <th>Département</th>
            <th>Prix de Base</th>
            <th>Variantes & Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_PRODUCTS.map((prod) => (
            <tr key={prod.id}>
              <td>
                <img
                  src={prod.primary_image}
                  alt={prod.name}
                  style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '2px' }}
                />
              </td>
              <td style={{ fontWeight: 600 }}>{prod.brand}</td>
              <td>{prod.name}</td>
              <td>
                <span className={styles.statusBadge} style={{ background: '#eee' }}>
                  {prod.department_type === 'WATCH' ? 'Horlogerie' : 'Joaillerie'}
                </span>
              </td>
              <td style={{ fontWeight: 600 }}>{formatFCFA(prod.base_price)}</td>
              <td>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 600 }}>
                  ✓ {prod.variants?.length || 1} Variante(s) en stock
                </span>
              </td>
              <td>
                <Button variant="outline" size="sm">Modifier</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

