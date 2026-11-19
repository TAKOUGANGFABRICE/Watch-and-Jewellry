import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import authService from '@/services/authService';
import Input from '@/components/forms/Input/Input';
import Button from '@/components/common/Button/Button';
import styles from './ResetPasswordPage.module.css';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';

  const [formData, setFormData] = useState({
    uidb64: uid,
    token: token,
    new_password: '',
    new_password_confirm: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.new_password.length < 8) {
      setError("Le nouveau mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    if (formData.new_password !== formData.new_password_confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.confirmPasswordReset(
        formData.uidb64,
        formData.token,
        formData.new_password,
        formData.new_password_confirm
      );
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const resp = err.response?.data;
      let msg = "Échec de la réinitialisation. Le lien a peut-être expiré.";
      if (resp?.token) {
        msg = Array.isArray(resp.token) ? resp.token.join(' ') : resp.token;
      } else if (resp?.message) {
        msg = resp.message;
      }
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
          <h1 className={styles.title}>Nouveau Mot de Passe</h1>
          <p className={styles.subtitle}>Définissez votre nouveau mot de passe confidentiel.</p>
        </div>

        {success ? (
          <div>
            <div className={styles.successCard}>
              Votre mot de passe a été réinitialisé avec succès ! Redirection vers la page de connexion...
            </div>
            <Link to="/login">
              <Button variant="primary" size="md" fullWidth>
                Se Connecter Immédiatement
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.errorMessage}>{error}</div>}

            {!uid && (
              <Input
                label="Identifiant de sécurité (UID)"
                name="uidb64"
                value={formData.uidb64}
                onChange={handleChange}
                required
              />
            )}

            {!token && (
              <Input
                label="Jeton de réinitialisation"
                name="token"
                value={formData.token}
                onChange={handleChange}
                required
              />
            )}

            <Input
              label="Nouveau mot de passe"
              name="new_password"
              type="password"
              placeholder="Minimum 8 caractères"
              value={formData.new_password}
              onChange={handleChange}
              required
            />

            <Input
              label="Confirmer le nouveau mot de passe"
              name="new_password_confirm"
              type="password"
              placeholder="••••••••"
              value={formData.new_password_confirm}
              onChange={handleChange}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              fullWidth
            >
              Enregistrer le Nouveau Mot de Passe
            </Button>
          </form>
        )}

        <div className={styles.footerActions}>
          <Link to="/login" className={styles.switchLink}>
            Retour à la Connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
