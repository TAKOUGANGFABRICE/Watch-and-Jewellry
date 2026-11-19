import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, Heart, Lock, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './AccountLayout.module.css';

export default function AccountLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm("Êtes-vous certain de vouloir vous déconnecter de votre espace FARÉL ?")) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <div className={`container ${styles.container}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Espace Privilège</h1>
        <p className={styles.subtitle}>
          Bienvenue{user?.first_name ? `, ${user.first_name}` : ''}. Gérez vos coordonnées, vos commandes et vos adresses exclusives au Cameroun.
        </p>
      </div>

      <div className={styles.grid}>
        <aside className={styles.sidebar}>
          <NavLink
            to="/account"
            end
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <User size={16} />
            <span>Mon Profil</span>
          </NavLink>

          <NavLink
            to="/account/orders"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <Package size={16} />
            <span>Mes Commandes</span>
          </NavLink>

          <NavLink
            to="/account/addresses"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <MapPin size={16} />
            <span>Adresses de Livraison</span>
          </NavLink>

          <NavLink
            to="/account/security"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <Lock size={16} />
            <span>Sécurité & Mot de Passe</span>
          </NavLink>

          <NavLink
            to="/account/wishlist"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <Heart size={16} />
            <span>Liste de Souhaits</span>
          </NavLink>

          <button
            type="button"
            className={styles.navLink}
            style={{
              marginTop: 'var(--space-md)',
              borderTop: '1px solid var(--color-border-grey)',
              width: '100%',
              textAlign: 'left',
              color: 'var(--color-muted-grey)',
            }}
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>Se Déconnecter</span>
          </button>
        </aside>

        <section className={styles.content}>
          <Outlet />
        </section>
      </div>
    </div>
  );
}
