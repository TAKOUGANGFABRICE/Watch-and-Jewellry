import React from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronRight, Phone, User, ShoppingBag } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import styles from './MobileNavDrawer.module.css';

export default function MobileNavDrawer() {
  const { isMobileNavOpen, closeMobileNav } = useUI();

  return (
    <>
      {/* Dimmed Backdrop */}
      <div
        className={`${styles.backdrop} ${isMobileNavOpen ? styles.backdropOpen : ''}`}
        onClick={closeMobileNav}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <aside
        className={`${styles.drawer} ${isMobileNavOpen ? styles.drawerOpen : ''}`}
        aria-label="Menu mobile"
      >
        <div className={styles.drawerHeader}>
          <span className={styles.brand}>FARÉL</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeMobileNav}
            aria-label="Fermer le menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className={styles.navLinks}>
          <Link to="/watches" className={styles.navItem} onClick={closeMobileNav}>
            <span>Montres de Luxe</span>
            <ChevronRight size={16} />
          </Link>
          <Link to="/jewellery" className={styles.navItem} onClick={closeMobileNav}>
            <span>Haute Joaillerie</span>
            <ChevronRight size={16} />
          </Link>
          <Link to="/new-arrivals" className={styles.navItem} onClick={closeMobileNav}>
            <span>Nouveautés</span>
            <ChevronRight size={16} />
          </Link>
          <Link to="/about" className={styles.navItem} onClick={closeMobileNav}>
            <span>La Maison FARÉL</span>
            <ChevronRight size={16} />
          </Link>
          <Link to="/account" className={styles.navItem} onClick={closeMobileNav}>
            <span>Mon Compte</span>
            <User size={16} />
          </Link>
          <Link to="/cart" className={styles.navItem} onClick={closeMobileNav}>
            <span>Mon Panier</span>
            <ShoppingBag size={16} />
          </Link>
        </nav>

        <div className={styles.drawerFooter}>
          <p className={styles.contactText}>
            Service Client Cameroun — Douala & Yaoundé<br />
            Lun - Sam : 08h30 - 18h30
          </p>
          <a
            href="https://wa.me/237699001122"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsappBtn}
          >
            <Phone size={16} />
            <span>Assistance WhatsApp Concierge</span>
          </a>
        </div>
      </aside>
    </>
  );
}

