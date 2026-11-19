import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, CreditCard, Sparkles, ArrowRight } from 'lucide-react';
import Button from '@/components/common/Button/Button';
import SectionHeading from '@/components/common/SectionHeading/SectionHeading';
import ProductCard from '@/components/product/ProductCard/ProductCard';
import { useCart } from '@/context/CartContext';
import { useUI } from '@/context/UIContext';
import { MOCK_PRODUCTS } from '@/utils/mockData';
import styles from './HomePage.module.css';

export default function HomePage() {
  const { addItem } = useCart();
  const { openCartDrawer } = useUI();

  const handleAddToCart = (product) => {
    addItem(product, product.variants?.[0], 1);
    openCartDrawer();
  };

  return (
    <div>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroEyebrow}>Maison d'Horlogerie & Haute Joaillerie</span>
          <h1 className={styles.heroTitle}>L'Élégance Pure au Cœur du Cameroun</h1>
          <p className={styles.heroSubtitle}>
            Une sélection exclusive de montres suisses et japonaises prestigieuses, 
            accompagnée de créations joaillières façonnées en or 18 carats et diamants certifiés.
          </p>
          <div className={styles.heroButtons}>
            <Button to="/watches" variant="primary" size="lg">
              Explorer les Montres
            </Button>
            <Button to="/jewellery" variant="outline" size="lg">
              Découvrir la Joaillerie
            </Button>
          </div>
        </div>
      </section>

      {/* Dual Luxury Departments Banner */}
      <section className={styles.departmentSection}>
        <div className="container">
          <SectionHeading
            eyebrow="Deux Départements d'Exception"
            title="L'Art du Temps & L'Éclat de la Matière"
            description="Explorez nos univers dédiés à la précision mécanique et à la haute joaillerie sur mesure."
          />

          <div className={styles.departmentGrid}>
            {/* Watches Card */}
            <Link to="/watches" className={styles.deptCard}>
              <img
                src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80"
                alt="Montres de Luxe FARÉL"
                className={styles.deptCardImage}
              />
              <div className={styles.deptCardContent}>
                <span className={styles.deptEyebrow}>Haute Horlogerie</span>
                <h3 className={styles.deptTitle}>Les Garde-Temps</h3>
                <span className={styles.deptLink}>
                  Découvrir la Collection <ArrowRight size={14} />
                </span>
              </div>
            </Link>

            {/* Jewellery Card */}
            <Link to="/jewellery" className={styles.deptCard}>
              <img
                src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80"
                alt="Haute Joaillerie FARÉL"
                className={styles.deptCardImage}
              />
              <div className={styles.deptCardContent}>
                <span className={styles.deptEyebrow}>Or 18 Carats & Diamants</span>
                <h3 className={styles.deptTitle}>La Joaillerie Fine</h3>
                <span className={styles.deptLink}>
                  Découvrir les Parures <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Signature Pieces */}
      <section className={styles.featuredSection}>
        <div className="container">
          <SectionHeading
            eyebrow="Sélection Signature"
            title="Créations Emblématiques"
            description="Chaque pièce est rigoureusement expertisée et garantie avec certificat d'authenticité."
            action={{ label: "Voir toutes les pièces", to: "/watches" }}
          />

          <div className={styles.productGrid}>
            {MOCK_PRODUCTS.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Luxury Trust Pillars Tailored to Cameroon */}
      <section className={styles.trustSection}>
        <div className="container">
          <div className={styles.trustGrid}>
            <div className={styles.trustItem}>
              <Truck size={28} className={styles.trustIcon} />
              <h4 className={styles.trustTitle}>Livraison Express 24h</h4>
              <p className={styles.trustText}>
                Coursiers privés à Douala et Yaoundé. Expédition sécurisée via agences partenaires dans les 10 régions du Cameroun.
              </p>
            </div>

            <div className={styles.trustItem}>
              <ShieldCheck size={28} className={styles.trustIcon} />
              <h4 className={styles.trustTitle}>Certificats GIA & Garantie</h4>
              <p className={styles.trustText}>
                Tous nos diamants sont certifiés GIA et nos métaux poinçonnés Or 18 carats (750/1000). Garantie mécanique 3 ans.
              </p>
            </div>

            <div className={styles.trustItem}>
              <CreditCard size={28} className={styles.trustIcon} />
              <h4 className={styles.trustTitle}>MoMo, OM & Cartes</h4>
              <p className={styles.trustText}>
                Réglez en toute sécurité via MTN Mobile Money, Orange Money ou cartes bancaires internationales en FCFA.
              </p>
            </div>

            <div className={styles.trustItem}>
              <Sparkles size={28} className={styles.trustIcon} />
              <h4 className={styles.trustTitle}>Showrooms Privés</h4>
              <p className={styles.trustText}>
                Essayez vos pièces sur rendez-vous privilégié dans nos boutiques de Bonapriso (Douala) et Bastos (Yaoundé).
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

