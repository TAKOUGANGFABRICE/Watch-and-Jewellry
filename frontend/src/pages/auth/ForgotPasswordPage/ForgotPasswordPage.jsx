import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '@/services/authService';
import Input from '@/components/forms/Input/Input';
import Button from '@/components/common/Button/Button';
import styles from './ForgotPasswordPage.module.css';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devInfo, setDevInfo] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      const res = await authService.requestPasswordReset(identifier.trim());
      setSubmitted(true);
      if (res.dev_debug) {
        setDevInfo(res.dev_debug);
      }
    } catch (err) {
      setError("Une erreur est survenue lors de l'envoi de la demande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <span className={styles.brand}>FARÉL</span>
          <h1 className={styles.title}>Réinitialisation Sécurisée</h1>
          <p className={styles.subtitle}>
            Saisissez votre email ou téléphone associé pour recevoir un lien de réinitialisation.
          </p>
        </div>

        {submitted ? (
          <div>
            <div className={styles.successCard}>
              Si un compte FARÉL correspond aux coordonnées indiquées, les instructions pour définir un nouveau mot de passe ont été transmises.
            </div>

            {devInfo && (
              <div className={styles.devBanner}>
                <strong>Mode Développement :</strong> Jeton de réinitialisation généré.
                <div style={{ marginTop: '8px' }}>
                  <Link to={devInfo.reset_url} style={{ color: 'var(--color-champagne-gold)', fontWeight: 600 }}>
                    Cliquez ici pour finaliser la réinitialisation &rarr;
                  </Link>
                </div>
              </div>
            )}

            <div style={{ marginTop: 'var(--space-xl)' }}>
              <Link to="/login">
                <Button variant="outline" size="md" fullWidth>
                  Retour à la Connexion
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div style={{ color: 'var(--color-error)', fontSize: '0.85rem' }}>{error}</div>}

            <Input
              label="Email ou Téléphone Cameroun"
              placeholder="ex: client@domaine.cm ou +237 6XXXXXXXX"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoFocus
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              fullWidth
            >
              Envoyer les Instructions
            </Button>
          </form>
        )}

        <div className={styles.footerActions}>
          <span>Vous vous souvenez de votre mot de passe ?</span>
          <Link to="/login" className={styles.switchLink}>
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
