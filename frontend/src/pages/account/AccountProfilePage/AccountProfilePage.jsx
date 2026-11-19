import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import authService from '@/services/authService';
import Input from '@/components/forms/Input/Input';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Loading/Spinner';
import { ShieldCheck, Calendar, Phone, Mail, Award, CheckCircle } from 'lucide-react';
import styles from './AccountProfilePage.module.css';

export default function AccountProfilePage() {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    preferred_city: 'Douala',
    language: 'fr',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        preferred_city: user.profile?.preferred_city || 'Douala',
        language: user.language || 'fr',
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Spinner size="md" />
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      const res = await authService.updateProfile(formData);
      updateUser(res.user);
      setSuccessMessage("Vos coordonnées ont été mises à jour avec succès.");
      setIsEditing(false);
    } catch (err) {
      const resp = err.response?.data;
      let msg = "Erreur lors de la mise à jour.";
      if (resp?.phone) {
        msg = Array.isArray(resp.phone) ? resp.phone.join(' ') : resp.phone;
      } else if (resp?.message) {
        msg = resp.message;
      }
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Client FARÉL';

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Mon Profil Privilège</h2>
          <p className={styles.subtitle}>
            Coordonnées personnelles et statut de conciergerie FARÉL.
          </p>
        </div>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Modifier Mes Informations
          </Button>
        )}
      </div>

      {successMessage && (
        <div className={styles.successAlert}>
          <CheckCircle size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && <div className={styles.errorAlert}>{errorMessage}</div>}

      {/* Customer Privilege Identity Card */}
      <div className={styles.privilegeCard}>
        <div className={styles.badgeRow}>
          <div className={styles.vipBadge}>
            <Award size={16} />
            <span>{user.profile?.vip_tier || 'STANDARD PRIVILÈGE'}</span>
          </div>
          <div className={styles.statusBadge}>
            <ShieldCheck size={14} />
            <span>Compte Vérifié</span>
          </div>
        </div>

        <h3 className={styles.customerName}>
          {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : 'Client Privilège'}
        </h3>

        <div className={styles.infoMeta}>
          <div className={styles.metaItem}>
            <Mail size={15} />
            <span>{user.email || 'Email non renseigné'}</span>
          </div>
          <div className={styles.metaItem}>
            <Phone size={15} />
            <span>{user.phone || 'Téléphone non renseigné'}</span>
          </div>
          <div className={styles.metaItem}>
            <Calendar size={15} />
            <span>Membre depuis le {formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Edit Form / Details Section */}
      {isEditing ? (
        <form onSubmit={handleSave} className={styles.formGrid}>
          <Input
            label="Prénom"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
          <Input
            label="Nom"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
          <Input
            label="Téléphone Cameroun (+237)"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            helperText="Format : +237 6XXXXXXXX (MTN ou Orange)"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
              Ville de livraison habituelle
            </label>
            <select
              name="preferred_city"
              value={formData.preferred_city}
              onChange={handleChange}
              style={{
                padding: '12px',
                border: '1px solid var(--color-border-grey)',
                backgroundColor: 'var(--color-white)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
              }}
            >
              <option value="Douala">Douala (Littoral)</option>
              <option value="Yaoundé">Yaoundé (Centre)</option>
              <option value="Bafoussam">Bafoussam (Ouest)</option>
              <option value="Garoua">Garoua (Nord)</option>
              <option value="Kribi">Kribi (Sud)</option>
              <option value="Limbé">Limbé (Sud-Ouest)</option>
            </select>
          </div>

          <div className={styles.actionRow}>
            <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
              Enregistrer les Modifications
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                setIsEditing(false);
                setErrorMessage('');
              }}
            >
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <div className={styles.readOnlyGrid}>
          <div className={styles.detailBox}>
            <span className={styles.detailLabel}>Email de Connexion</span>
            <span className={styles.detailValue}>{user.email || '—'}</span>
          </div>
          <div className={styles.detailBox}>
            <span className={styles.detailLabel}>Téléphone WhatsApp / Appel</span>
            <span className={styles.detailValue}>{user.phone || '—'}</span>
          </div>
          <div className={styles.detailBox}>
            <span className={styles.detailLabel}>Ville de Référence</span>
            <span className={styles.detailValue}>{user.profile?.preferred_city || 'Douala'}</span>
          </div>
          <div className={styles.detailBox}>
            <span className={styles.detailLabel}>Nombre d'Adresses Enregistrées</span>
            <span className={styles.detailValue}>{user.saved_addresses_count || 0} adresse(s)</span>
          </div>
        </div>
      )}
    </div>
  );
}
