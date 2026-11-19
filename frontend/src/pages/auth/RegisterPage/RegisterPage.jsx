import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/forms/Input/Input';
import Button from '@/components/common/Button/Button';
import styles from './RegisterPage.module.css';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirm: '',
    preferred_city: 'Douala',
    newsletter_subscribed: true,
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email && !formData.phone) {
      setError("Veuillez renseigner au moins une adresse email ou un numéro de téléphone.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    if (formData.password !== formData.password_confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(formData);
      navigate('/account', { replace: true });
    } catch (err) {
      const resp = err.response?.data;
      let msg = "Erreur lors de l'inscription. Veuillez vérifier vos informations.";
      if (resp?.errors) {
        msg = Object.values(resp.errors).flat().join(' ');
      } else if (resp?.phone) {
        msg = Array.isArray(resp.phone) ? resp.phone.join(' ') : resp.phone;
      } else if (resp?.email) {
        msg = Array.isArray(resp.email) ? resp.email.join(' ') : resp.email;
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
          <h1 className={styles.title}>Devenir Membre Privilège</h1>
          <p className={styles.subtitle}>Créez votre compte pour bénéficier de services sur-mesure et d'un suivi privilégié.</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.nameRow}>
            <Input
              label="Prénom"
              name="first_name"
              placeholder="ex: Samuel"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
            <Input
              label="Nom"
              name="last_name"
              placeholder="ex: Eto"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Adresse Email"
            name="email"
            type="email"
            placeholder="votre.email@domaine.cm"
            value={formData.email}
            onChange={handleChange}
          />

          <Input
            label="Téléphone Cameroun (+237)"
            name="phone"
            placeholder="ex: +237 690 12 34 56 ou 6XXXXXXXX"
            helperText="Recommandé pour la coordination de la livraison privée"
            value={formData.phone}
            onChange={handleChange}
          />

          <Input
            label="Mot de passe sécurisé"
            name="password"
            type="password"
            placeholder="Minimum 8 caractères"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <Input
            label="Confirmer le mot de passe"
            name="password_confirm"
            type="password"
            placeholder="••••••••"
            value={formData.password_confirm}
            onChange={handleChange}
            required
          />

          <label className={styles.checkboxContainer}>
            <input
              type="checkbox"
              name="newsletter_subscribed"
              checked={formData.newsletter_subscribed}
              onChange={handleChange}
              className={styles.checkbox}
            />
            <span>Recevoir les invitations aux ventes privées et nouvelles collections FARÉL.</span>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            fullWidth
          >
            Créer Mon Compte Privilège
          </Button>
        </form>

        <div className={styles.footerActions}>
          <span>Déjà client FARÉL ?</span>
          <Link to="/login" className={styles.switchLink}>
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
