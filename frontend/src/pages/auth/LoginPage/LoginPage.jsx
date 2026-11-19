import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/forms/Input/Input';
import Button from '@/components/common/Button/Button';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/account';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError("Veuillez saisir votre email ou numéro de téléphone.");
      return;
    }
    if (!password) {
      setError("Veuillez saisir votre mot de passe.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(identifier.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail ||
                  err.response?.data?.message ||
                  "Identifiants incorrects. Veuillez vérifier vos données.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <span className={styles.brand}>FARÉL</span>
          <h1 className={styles.title}>Espace Privilège</h1>
          <p className={styles.subtitle}>Connectez-vous pour accéder à vos commandes et adresses exclusives.</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Email ou Téléphone Cameroun (+237)"
            placeholder="ex: contact@client.cm ou 690123456"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Link to="/forgot-password" className={styles.forgotLink}>
            Mot de passe oublié ?
          </Link>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            fullWidth
          >
            Se Connecter
          </Button>
        </form>

        <div className={styles.guestDivider}>
          <span>Ou continuer librement</span>
        </div>

        <button
          type="button"
          className={styles.guestButton}
          onClick={() => navigate('/catalog')}
        >
          Découvrir le Catalogue sans compte
        </button>

        <div className={styles.footerActions}>
          <span>Nouveau client FARÉL ?</span>
          <Link to="/register" className={styles.switchLink}>
            Créer un Compte Privilège
          </Link>
        </div>
      </div>
    </div>
  );
}
