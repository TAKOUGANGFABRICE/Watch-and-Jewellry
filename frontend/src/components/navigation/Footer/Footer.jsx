import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/common/Button/Button';
import styles from './Footer.module.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          {/* Brand Presentation Column */}
          <div className={styles.brandCol}>
            <div>
              <span className={styles.brandLogo}>FARÉL</span>
              <p className={styles.tagline}>Style Within Your Reach</p>
            </div>
            <p className={styles.description}>
              Maison de haute horlogerie et de haute joaillerie fondée pour offrir l'excellence, 
              la précision et la distinction au public camerounais le plus exigeant.
            </p>
            <div className={styles.boutiqueInfo}>
              <p className={styles.boutiqueLocation}>Showrooms au Cameroun :</p>
              <p>• Douala : Avenue De Gaulle, Bonapriso (Face Bicec)</p>
              <p>• Yaoundé : Rue des Ambassades, Bastos</p>
              <p>• Contact : +237 699 00 11 22 / concierge@farel.cm</p>
            </div>
          </div>

          {/* Catalog Departments Column */}
          <div>
            <h4 className={styles.colTitle}>Collections</h4>
            <ul className={styles.linkList}>
              <li className={styles.linkItem}>
                <Link to="/watches">Montres Homme & Femme</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/watches?category=chronographes">Chronographes Suisses</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/watches?category=automatiques">Montres Automatiques</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/jewellery">Bagues & Solitaires 18k</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/jewellery?category=colliers-or">Colliers & Pendentifs Diamant</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/jewellery?category=bracelets-joncs">Bracelets Jonc en Or</Link>
              </li>
            </ul>
          </div>

          {/* Customer Care Column */}
          <div>
            <h4 className={styles.colTitle}>Service Client</h4>
            <ul className={styles.linkList}>
              <li className={styles.linkItem}>
                <Link to="/shipping-info">Livraison Douala & Régions</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/agency-pickup">Agences de Retrait (Touristique, Buca)</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/authenticity">Certificats GIA & Garantie</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/ring-size-guide">Guide des Tailles de Bagues</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/terms">Conditions Générales</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/contact">Prendre Rendez-vous en Boutique</Link>
              </li>
            </ul>
          </div>

          {/* Newsletter & Payment Badges Column */}
          <div className={styles.newsletterCol}>
            <h4 className={styles.colTitle}>Club Privilège</h4>
            <p className={styles.newsletterText}>
              Recevez les invitations privées à nos lancements exclusifs et pièces numérotées.
            </p>
            {subscribed ? (
              <p style={{ color: 'var(--color-champagne-gold)', fontSize: '0.85rem' }}>
                ✓ Merci de votre inscription au Club Privilège FARÉL.
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className={styles.newsletterForm}>
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.newsletterInput}
                  required
                />
                <Button type="submit" variant="primary" size="sm">
                  Rejoindre
                </Button>
              </form>
            )}

            <div className={styles.paymentMethods}>
              <span className={styles.paymentLabel}>Paiements Sécurisés au Cameroun</span>
              <div className={styles.paymentBadges}>
                <span className={`${styles.badge} ${styles.badgeMomo}`}>MTN MoMo</span>
                <span className={`${styles.badge} ${styles.badgeOrange}`}>Orange Money</span>
                <span className={styles.badge}>Visa</span>
                <span className={styles.badge}>Mastercard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p>© {new Date().getFullYear()} FARÉL. Tous droits réservés. Monnaie : FCFA (XAF).</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link to="/privacy">Politique de Confidentialité</Link>
            <span>•</span>
            <Link to="/admin" className={styles.adminLink}>Accès Administration</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

