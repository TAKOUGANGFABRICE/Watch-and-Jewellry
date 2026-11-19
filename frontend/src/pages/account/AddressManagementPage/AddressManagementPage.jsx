import React, { useState, useEffect } from 'react';
import authService from '@/services/authService';
import Input from '@/components/forms/Input/Input';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Loading/Spinner';
import { MapPin, Plus, Trash2, Edit2, Check } from 'lucide-react';
import styles from './AddressManagementPage.module.css';

export default function AddressManagementPage() {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    recipient_name: '',
    phone_number: '',
    secondary_phone: '',
    region: 'Littoral',
    city: 'Douala',
    neighborhood: '',
    landmark: '',
    is_default: false,
  });

  const loadAddresses = async () => {
    setIsLoading(true);
    try {
      const data = await authService.getAddresses();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading addresses:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      recipient_name: '',
      phone_number: '',
      secondary_phone: '',
      region: 'Littoral',
      city: 'Douala',
      neighborhood: '',
      landmark: '',
      is_default: addresses.length === 0,
    });
    setError('');
    setShowForm(true);
  };

  const handleOpenEdit = (addr) => {
    setEditingId(addr.id);
    setFormData({
      recipient_name: addr.recipient_name,
      phone_number: addr.phone_number,
      secondary_phone: addr.secondary_phone || '',
      region: addr.region || 'Littoral',
      city: addr.city,
      neighborhood: addr.neighborhood,
      landmark: addr.landmark || '',
      is_default: addr.is_default,
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      if (editingId) {
        await authService.updateAddress(editingId, formData);
      } else {
        await authService.createAddress(formData);
      }
      setShowForm(false);
      await loadAddresses();
    } catch (err) {
      const resp = err.response?.data;
      let msg = "Erreur lors de l'enregistrement de l'adresse.";
      if (resp?.phone_number) {
        msg = Array.isArray(resp.phone_number) ? resp.phone_number.join(' ') : resp.phone_number;
      } else if (resp?.errors) {
        msg = Object.values(resp.errors).flat().join(' ');
      }
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous certain de vouloir supprimer cette adresse de livraison ?")) return;
    try {
      await authService.deleteAddress(id);
      await loadAddresses();
    } catch (err) {
      alert("Impossible de supprimer cette adresse.");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await authService.setDefaultAddress(id);
      await loadAddresses();
    } catch (err) {
      alert("Erreur lors de la définition de l'adresse par défaut.");
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Carnet d'Adresses Cameroun</h2>
          <p className={styles.subtitle}>
            Gérez vos points de livraison sécurisés à Douala, Yaoundé et dans les autres régions.
          </p>
        </div>
        {!showForm && (
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            Nouvelle Adresse
          </Button>
        )}
      </div>

      {showForm && (
        <div className={styles.formModal}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: 'var(--space-md)' }}>
            {editingId ? "Modifier l'adresse" : "Ajouter une nouvelle adresse de livraison"}
          </h3>

          {error && (
            <div style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginBottom: 'var(--space-sm)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className={styles.formGrid}>
            <Input
              label="Nom & Prénom du destinataire"
              name="recipient_name"
              placeholder="ex: Samuel Eto"
              value={formData.recipient_name}
              onChange={handleInputChange}
              required
            />

            <Input
              label="Téléphone principal WhatsApp / Appel"
              name="phone_number"
              placeholder="ex: +237 690 12 34 56"
              helperText="Utilisé par le coursier pour la confirmation"
              value={formData.phone_number}
              onChange={handleInputChange}
              required
            />

            <Input
              label="Téléphone secondaire (Optionnel)"
              name="secondary_phone"
              placeholder="ex: +237 670 00 11 22"
              value={formData.secondary_phone}
              onChange={handleInputChange}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Région</label>
              <select
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                style={{ padding: '12px', border: '1px solid var(--color-border-grey)', backgroundColor: '#FFF' }}
              >
                <option value="Littoral">Littoral (Douala)</option>
                <option value="Centre">Centre (Yaoundé)</option>
                <option value="Ouest">Ouest (Bafoussam)</option>
                <option value="Nord">Nord (Garoua)</option>
                <option value="Sud">Sud (Kribi, Ebolowa)</option>
                <option value="Sud-Ouest">Sud-Ouest (Limbé, Buea)</option>
                <option value="Nord-Ouest">Nord-Ouest (Bamenda)</option>
                <option value="Adamaoua">Adamaoua (Ngaoundéré)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ville</label>
              <input
                name="city"
                type="text"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Douala, Yaoundé, etc."
                required
                style={{ padding: '12px', border: '1px solid var(--color-border-grey)', backgroundColor: '#FFF' }}
              />
            </div>

            <Input
              label="Quartier"
              name="neighborhood"
              placeholder="ex: Bonapriso, Bastos, Akwa, Makepe"
              value={formData.neighborhood}
              onChange={handleInputChange}
              required
            />

            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                label="Repère précis pour le coursier"
                name="landmark"
                placeholder="ex: Face Boulangerie Zépol, portail noir en fer forgé"
                value={formData.landmark}
                onChange={handleInputChange}
              />
            </div>

            <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="is_default"
                checked={formData.is_default}
                onChange={handleInputChange}
                style={{ accentColor: 'var(--color-champagne-gold)' }}
              />
              <span style={{ fontSize: '0.88rem' }}>Définir comme adresse de livraison par défaut</span>
            </label>

            <div className={styles.formActions}>
              <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
                Enregistrer l'Adresse
              </Button>
              <Button type="button" variant="outline" size="md" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Spinner size="md" />
        </div>
      ) : addresses.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--color-border-grey)', backgroundColor: 'var(--color-cream-subtle)' }}>
          <MapPin size={32} style={{ color: 'var(--color-champagne-gold)', marginBottom: 'var(--space-sm)' }} />
          <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: 'var(--space-xs)' }}>
            Aucune adresse enregistrée
          </h4>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-muted-grey)', marginBottom: 'var(--space-md)' }}>
            Ajoutez votre adresse au Cameroun pour accélérer la livraison de vos prochaines commandes.
          </p>
          <Button variant="outline" size="sm" onClick={handleOpenCreate}>
            Ajouter une Adresse
          </Button>
        </div>
      ) : (
        <div className={styles.addressList}>
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`${styles.addressCard} ${addr.is_default ? styles.defaultCard : ''}`}
            >
              {addr.is_default && <span className={styles.defaultBadge}>Par Défaut</span>}

              <div>
                <h4 className={styles.recipientName}>{addr.recipient_name}</h4>
                <p className={styles.locationText}>
                  {addr.neighborhood}, {addr.city} ({addr.region})
                </p>
                {addr.landmark && <p className={styles.landmarkText}>Repère : {addr.landmark}</p>}
                <div className={styles.phoneRow}>
                  <span>Tél : {addr.phone_number}</span>
                  {addr.secondary_phone && <span> • Backup : {addr.secondary_phone}</span>}
                </div>
              </div>

              <div className={styles.actionsRow}>
                {!addr.is_default && (
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => handleSetDefault(addr.id)}
                  >
                    Définir par défaut
                  </button>
                )}
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => handleOpenEdit(addr)}
                    aria-label="Modifier"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                    onClick={() => handleDelete(addr.id)}
                    aria-label="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
