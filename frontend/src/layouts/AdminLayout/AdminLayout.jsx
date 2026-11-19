import React from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Watch, Boxes, ShoppingCart, Truck, Star, ArrowLeft } from 'lucide-react';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname.includes('/admin/products')) return 'Gestion du Catalogue & Variantes';
    if (location.pathname.includes('/admin/inventory')) return 'Contrôle des Stocks & Alertes';
    if (location.pathname.includes('/admin/orders')) return 'Gestion des Commandes & Expéditions';
    if (location.pathname.includes('/admin/shipping')) return 'Logistique & Agences au Cameroun';
    if (location.pathname.includes('/admin/reviews')) return 'Modération des Avis Clients';
    return 'Tableau de Bord Opérationnel';
  };

  return (
    <div className={styles.adminLayout}>
      {/* Left Administration Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.brand}>FARÉL</span>
          <span className={styles.badgeAdmin}>Back-Office Pro</span>
        </div>

        <nav className={styles.nav}>
          <span className={styles.navHeading}>Pilotage</span>
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <LayoutDashboard size={18} />
            <span>Tableau de Bord</span>
          </NavLink>

          <span className={styles.navHeading}>Catalogue & Stocks</span>
          <NavLink
            to="/admin/products"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <Watch size={18} />
            <span>Produits & Variantes</span>
          </NavLink>

          <NavLink
            to="/admin/inventory"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <Boxes size={18} />
            <span>Contrôle des Stocks</span>
          </NavLink>

          <span className={styles.navHeading}>Fulfillment & Ventes</span>
          <NavLink
            to="/admin/orders"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <ShoppingCart size={18} />
            <span>Commandes (FCFA)</span>
          </NavLink>

          <NavLink
            to="/admin/shipping"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <Truck size={18} />
            <span>Expéditions Cameroun</span>
          </NavLink>

          <NavLink
            to="/admin/reviews"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <Star size={18} />
            <span>Avis Clients</span>
          </NavLink>
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.backToStore}>
            <ArrowLeft size={16} />
            <span>Voir le Site Client</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin Content Canvas */}
      <div className={styles.mainArea}>
        <header className={styles.topBar}>
          <h1 className={styles.pageTitle}>{getPageTitle()}</h1>

          <div className={styles.staffProfile}>
            <div className={styles.staffAvatar}>AD</div>
            <div className={styles.staffDetails}>
              <span className={styles.staffName}>Armel Director</span>
              <span className={styles.staffRole}>Super Administrateur • Douala</span>
            </div>
          </div>
        </header>

        <main className={styles.contentWrapper}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

