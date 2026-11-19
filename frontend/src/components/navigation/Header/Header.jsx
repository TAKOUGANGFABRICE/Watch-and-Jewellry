import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, Search, User, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useUI } from '@/context/UIContext';
import { useAuth } from '@/context/AuthContext';
import styles from './Header.module.css';

export default function Header() {
  const { totalItems } = useCart();
  const { toggleMobileNav, openCartDrawer, toggleSearch } = useUI();
  const { isAuthenticated, user } = useAuth();

  return (
    <header className={styles.headerWrapper}>
      {/* Top Luxury Announcement Bar */}
      <div className={styles.announcementBar}>
        <div className={styles.currencyBadge}>
          <ShieldCheck size={12} />
          <span>CAMEROUN | FCFA</span>
        </div>
        <p className={styles.announcementText}>
          Livraison offerte dès <span className={styles.announcementAccent}>150 000 FCFA</span> à Douala & Yaoundé — Expédition sécurisée
        </p>
        <div className={styles.currencyBadge} style={{ visibility: 'hidden' }}>
          <span>XAF</span>
        </div>
      </div>

      {/* Main Brand Navigation Bar */}
      <nav className={styles.navBar} aria-label="Navigation principale">
        {/* Left: Mobile hamburger & Desktop Navigation links */}
        <div className={styles.leftGroup}>
          <button
            type="button"
            className={styles.menuToggle}
            onClick={toggleMobileNav}
            aria-label="Ouvrir le menu de navigation"
          >
            <Menu size={24} />
          </button>

          <div className={styles.desktopNav}>
            <NavLink
              to="/watches"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Montres
            </NavLink>
            <NavLink
              to="/jewellery"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Joaillerie
            </NavLink>
            <NavLink
              to="/new-arrivals"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Nouveautés
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              La Maison
            </NavLink>
          </div>
        </div>

        {/* Center: Brand Identity Logo */}
        <Link to="/" className={styles.brandLogo} aria-label="FARÉL Accueil">
          <span className={styles.logoTitle}>FARÉL</span>
          <span className={styles.logoTagline}>STYLE WITHIN YOUR REACH</span>
        </Link>

        {/* Right: Actions (Search, Account, Shopping Bag) */}
        <div className={styles.rightGroup}>
          <button
            type="button"
            onClick={toggleSearch}
            className={styles.actionBtn}
            aria-label="Rechercher des montres ou bijoux"
          >
            <Search size={20} />
          </button>

          <Link
            to={isAuthenticated ? "/account" : "/login"}
            className={styles.actionBtn}
            aria-label={isAuthenticated ? "Mon compte client" : "Se connecter"}
            title={isAuthenticated ? `Connecté : ${user?.first_name || user?.email}` : "Se connecter"}
          >
            <User size={20} />
            {isAuthenticated && user?.first_name && (
              <span style={{ fontSize: '0.75rem', fontWeight: 600, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.first_name}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={openCartDrawer}
            className={styles.actionBtn}
            aria-label={`Panier (${totalItems} articles)`}
          >
            <ShoppingBag size={20} />
            {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
          </button>
        </div>
      </nav>
    </header>
  );
}

