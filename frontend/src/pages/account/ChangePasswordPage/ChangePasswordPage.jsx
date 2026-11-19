import React, { useState } from 'react';
import authService from '@/services/authService';
import Input from '@/components/forms/Input/Input';
import Button from '@/components/common/Button/Button';
import { Lock, CheckCircle } from 'lucide-react';

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.new_password.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (formData.new_password !== formData.new_password_confirm) {
      setError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.changePassword(
        formData.old_password,
        formData.new_password,
        formData.new_password_confirm
      );
      setSuccess("Votre mot de passe a été modifié avec succès.");
      setFormData({ old_password: '', new_password: '', new_password_confirm: '' });
    } catch (err) {
      const resp = err.response?.data;
      let msg = "Erreur lors de la modification du mot de passe.";
      if (resp?.old_password) {
        msg = Array.isArray(resp.old_password) ? resp.old_password.join(' ') : resp.old_password;
      } else if (resp?.new_password) {
        msg = Array.isArray(resp.new_password) ? resp.new_password.join(' ') : resp.new_password;
      } else if (resp?.message) {
        msg = resp.message;
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: 'var(--space-xs)' }}>
        Sécurité & Mot de Passe
      </h2>
      <p style={{ fontSize: '0.88rem', color: 'var(--color-muted-grey)', marginBottom: 'var(--space-xl)' }}>
        Modifiez votre mot de passe pour protéger votre compte client FARÉL.
      </p>

      {success && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px',
            backgroundColor: 'rgba(46, 125, 50, 0.1)',
            color: 'var(--color-success)',
            marginBottom: 'var(--space-md)',
            fontSize: '0.88rem',
          }}
        >
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(211, 47, 47, 0.08)',
            borderLeft: '3px solid var(--color-error)',
            color: 'var(--color-error)',
            marginBottom: 'var(--space-md)',
            fontSize: '0.88rem',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <Input
          label="Mot de passe actuel"
          name="old_password"
          type="password"
          placeholder="••••••••"
          value={formData.old_password}
          onChange={handleChange}
          required
        />

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

        <div style={{ marginTop: 'var(--space-sm)' }}>
          <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
            Mettre à Jour le Mot de Passe
          </Button>
        </div>
      </form>
    </div>
  );
}
