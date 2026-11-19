import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import orderService from '@/services/orderService';
import paymentService from '@/services/paymentService';
import authService from '@/services/authService';
import { formatFCFA } from '@/utils/currency';
import Input from '@/components/forms/Input/Input';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Loading/Spinner';
import {
  User,
  MapPin,
  Truck,
  CreditCard,
  CheckCircle,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import styles from './CheckoutPage.module.css';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Current Checkout Step: 1 -> 2 -> 3 -> 4 -> 5 (Confirmation)
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Customer Info
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
  });

  // Step 2: Delivery Address
  const [shippingAddress, setShippingAddress] = useState({
    recipient_name: '',
    primary_phone: '',
    backup_phone: '',
    region: 'Littoral',
    city: 'Douala',
    neighborhood: '',
    landmark: '',
    additional_instructions: '',
  });

  // Saved addresses for logged-in users
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // Step 3: Delivery Method
  const [deliveryMethod, setDeliveryMethod] = useState('DOORSTEP_EXPRESS');

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState('MTN_MOMO');
  const [momoPhone, setMomoPhone] = useState('');

  // Execution states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Payment USSD Verification Modal
  const [pendingTx, setPendingTx] = useState(null);
  const [ussdInstructions, setUssdInstructions] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Step 5: Completed Order
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Prefill user data if authenticated
  useEffect(() => {
    if (user) {
      setCustomerInfo({
        name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        phone: user.phone || '',
        email: user.email || '',
      });
      setMomoPhone(user.phone || '');

      authService.getAddresses().then((addrs) => {
        if (Array.isArray(addrs) && addrs.length > 0) {
          setSavedAddresses(addrs);
          const defaultAddr = addrs.find((a) => a.is_default) || addrs[0];
          setSelectedAddressId(defaultAddr.id);
          applySavedAddress(defaultAddr);
        }
      });
    }
  }, [user]);

  const applySavedAddress = (addr) => {
    setShippingAddress({
      recipient_name: addr.recipient_name,
      primary_phone: addr.phone_number,
      backup_phone: addr.secondary_phone || '',
      region: addr.region || 'Littoral',
      city: addr.city,
      neighborhood: addr.neighborhood,
      landmark: addr.landmark || '',
      additional_instructions: '',
    });
  };

  // Calculate dynamic delivery fee
  const calculateDeliveryFee = () => {
    if (deliveryMethod === 'SHOWROOM_COLLECTION') return 0;
    if (subtotal >= 150000) return 0; // Free delivery threshold
    const cityLower = shippingAddress.city.toLowerCase().trim();
    if (cityLower.includes('douala')) {
      return deliveryMethod === 'AGENCY_PICKUP' ? 1500 : 2000;
    } else if (cityLower.includes('yaound')) {
      return deliveryMethod === 'AGENCY_PICKUP' ? 2000 : 3000;
    }
    return deliveryMethod === 'AGENCY_PICKUP' ? 2500 : 3500;
  };

  const deliveryFee = calculateDeliveryFee();
  const grandTotal = subtotal + deliveryFee;

  // Form Handlers
  const handleNextStep = (e) => {
    e?.preventDefault();
    setErrorMessage('');

    if (currentStep === 1) {
      if (!customerInfo.name.trim()) {
        setErrorMessage("Veuillez renseigner votre nom complet.");
        return;
      }
      if (!customerInfo.phone.trim()) {
        setErrorMessage("Veuillez renseigner un numéro de téléphone camerounais (+237).");
        return;
      }
      if (!shippingAddress.recipient_name) {
        setShippingAddress((prev) => ({
          ...prev,
          recipient_name: customerInfo.name,
          primary_phone: customerInfo.phone,
        }));
      }
      if (!momoPhone) {
        setMomoPhone(customerInfo.phone);
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!shippingAddress.neighborhood.trim()) {
        setErrorMessage("Veuillez indiquer le quartier de livraison.");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  // Submit Order & Initiate Payment
  const handleFinalOrderSubmit = async () => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      // 1. Prepare checkout order payload
      const orderPayload = {
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_email: customerInfo.email,
        delivery_method: deliveryMethod,
        shipping_address: {
          recipient_name: shippingAddress.recipient_name || customerInfo.name,
          primary_phone: shippingAddress.primary_phone || customerInfo.phone,
          backup_phone: shippingAddress.backup_phone,
          region: shippingAddress.region,
          city: shippingAddress.city,
          neighborhood: shippingAddress.neighborhood,
          landmark: shippingAddress.landmark,
          additional_instructions: shippingAddress.additional_instructions,
        },
        items: items.map((it) => ({
          variant_id: it.variantId,
          quantity: it.quantity,
        })),
        customer_notes: shippingAddress.additional_instructions,
      };

      // 2. Create Order in backend
      const orderRes = await orderService.createCheckout(orderPayload);
      const createdOrder = orderRes.order;

      // 3. Initiate Payment with selected gateway
      const paymentPayload = {
        order_number: createdOrder.order_number,
        payment_method: paymentMethod,
        customer_phone: momoPhone || customerInfo.phone,
        idempotency_key: `order_pay_${createdOrder.order_number}`,
      };

      const payRes = await paymentService.initiatePayment(paymentPayload);

      // Handle COD / Wire vs Instant USSD MoMo/Orange
      if (paymentMethod === 'CASH_ON_DELIVERY' || paymentMethod === 'BANK_TRANSFER') {
        clearCart();
        setConfirmedOrder(createdOrder);
        setCurrentStep(5);
      } else {
        // Open USSD prompt modal
        setPendingTx(payRes.transaction);
        setUssdInstructions(payRes.instructions);
        setConfirmedOrder(createdOrder);
      }
    } catch (err) {
      const resp = err.response?.data;
      let msg = "Une erreur est survenue lors de la validation de votre commande.";
      if (resp?.error) {
        msg = resp.error;
      } else if (resp?.message) {
        msg = resp.message;
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify server-side payment
  const handleVerifyPayment = async () => {
    if (!pendingTx) return;
    setIsVerifying(true);
    setErrorMessage('');

    try {
      const res = await paymentService.verifyPayment(pendingTx.transaction_reference);
      if (res.verified && res.status === 'SUCCESSFUL') {
        clearCart();
        setPendingTx(null);
        setCurrentStep(5);
      } else {
        setErrorMessage("Le paiement n'a pas encore été validé sur votre mobile. Veuillez saisir votre code PIN puis réessayer.");
      }
    } catch (err) {
      setErrorMessage("Échec de la vérification du paiement. Veuillez réessayer.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Development / Demo shortcut to simulate successful USSD PIN validation
  const handleSimulateUssdSuccess = async () => {
    if (!pendingTx) return;
    setIsVerifying(true);
    try {
      await paymentService.simulatePaymentSuccess(pendingTx.transaction_reference);
      clearCart();
      setPendingTx(null);
      setCurrentStep(5);
    } catch (err) {
      setErrorMessage("Erreur lors de la simulation de paiement.");
    } finally {
      setIsVerifying(false);
    }
  };

  // If cart is empty and not on confirmation step
  if (items.length === 0 && currentStep !== 5) {
    return (
      <div className={`container ${styles.pageWrapper}`} style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', marginBottom: 'var(--space-md)' }}>
          Votre panier est vide
        </h2>
        <p style={{ color: 'var(--color-muted-grey)', marginBottom: 'var(--space-lg)' }}>
          Ajoutez des montres ou des bijoux à votre panier pour procéder au paiement sécurisé.
        </p>
        <Link to="/catalog">
          <Button variant="primary" size="md">
            Découvrir le Catalogue
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={`container ${styles.pageWrapper}`}>
      {/* 5-Step Progress Bar */}
      <div className={styles.stepIndicator}>
        <div className={`${styles.stepItem} ${currentStep === 1 ? styles.stepItemActive : currentStep > 1 ? styles.stepItemDone : ''}`}>
          <span className={styles.stepNumber}>{currentStep > 1 ? '✓' : '1'}</span>
          <span>Client</span>
        </div>
        <div className={`${styles.stepItem} ${currentStep === 2 ? styles.stepItemActive : currentStep > 2 ? styles.stepItemDone : ''}`}>
          <span className={styles.stepNumber}>{currentStep > 2 ? '✓' : '2'}</span>
          <span>Livraison</span>
        </div>
        <div className={`${styles.stepItem} ${currentStep === 3 ? styles.stepItemActive : currentStep > 3 ? styles.stepItemDone : ''}`}>
          <span className={styles.stepNumber}>{currentStep > 3 ? '✓' : '3'}</span>
          <span>Mode</span>
        </div>
        <div className={`${styles.stepItem} ${currentStep === 4 ? styles.stepItemActive : currentStep > 4 ? styles.stepItemDone : ''}`}>
          <span className={styles.stepNumber}>{currentStep > 4 ? '✓' : '4'}</span>
          <span>Paiement</span>
        </div>
        <div className={`${styles.stepItem} ${currentStep === 5 ? styles.stepItemActive : ''}`}>
          <span className={styles.stepNumber}>5</span>
          <span>Confirmation</span>
        </div>
      </div>

      {errorMessage && (
        <div style={{ padding: '12px var(--space-md)', backgroundColor: 'rgba(211, 47, 47, 0.08)', borderLeft: '3px solid var(--color-error)', color: 'var(--color-error)', marginBottom: 'var(--space-lg)', fontSize: '0.88rem' }}>
          {errorMessage}
        </div>
      )}

      {/* Main Checkout Grid */}
      <div className={styles.checkoutLayout}>
        <div className={styles.mainContent}>
          {/* STEP 1: Customer Information */}
          {currentStep === 1 && (
            <div className={styles.cardSection}>
              <h2 className={styles.sectionTitle}>
                <User size={20} />
                <span>Étape 1 : Coordonnées Client</span>
              </h2>
              <p className={styles.sectionSubtitle}>
                {isAuthenticated
                  ? `Connecté en tant que ${user?.email || user?.phone}. Vos informations sont pré-remplies.`
                  : "Commandez en tant qu'invité ou connectez-vous pour retrouver vos adresses."}
              </p>

              <form onSubmit={handleNextStep} className={styles.formGrid}>
                <Input
                  label="Nom complet du client"
                  placeholder="ex: Samuel Eto"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  required
                />
                <Input
                  label="Numéro de contact Cameroun (+237)"
                  placeholder="ex: +237 690 12 34 56 ou 6XXXXXXXX"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  helperText="Requis pour la coordination avec le coursier FARÉL"
                  required
                />
                <div style={{ gridColumn: '1 / -1' }}>
                  <Input
                    label="Adresse email (pour la facture et le suivi)"
                    type="email"
                    placeholder="votre.email@domaine.cm"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', marginTop: 'var(--space-md)' }}>
                  <Button type="submit" variant="primary" size="lg" fullWidth>
                    Continuer vers la Livraison &rarr;
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: Delivery Information */}
          {currentStep === 2 && (
            <div className={styles.cardSection}>
              <h2 className={styles.sectionTitle}>
                <MapPin size={20} />
                <span>Étape 2 : Adresse de Livraison au Cameroun</span>
              </h2>
              <p className={styles.sectionSubtitle}>
                Précisez le quartier et un repère géographique pour notre coursier privé.
              </p>

              {savedAddresses.length > 0 && (
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Utiliser une adresse enregistrée :
                  </label>
                  <select
                    value={selectedAddressId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedAddressId(id);
                      const found = savedAddresses.find((a) => a.id === id);
                      if (found) applySavedAddress(found);
                    }}
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border-grey)', backgroundColor: '#FFF' }}
                  >
                    {savedAddresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.recipient_name} — {a.neighborhood}, {a.city} {a.is_default ? '(Par défaut)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <form onSubmit={handleNextStep} className={styles.formGrid}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ville</label>
                  <select
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    style={{ padding: '12px', border: '1px solid var(--color-border-grey)', backgroundColor: '#FFF' }}
                  >
                    <option value="Douala">Douala (Littoral)</option>
                    <option value="Yaoundé">Yaoundé (Centre)</option>
                    <option value="Bafoussam">Bafoussam (Ouest)</option>
                    <option value="Garoua">Garoua (Nord)</option>
                    <option value="Kribi">Kribi (Sud)</option>
                    <option value="Limbé">Limbé (Sud-Ouest)</option>
                    <option value="Bamenda">Bamenda (Nord-Ouest)</option>
                    <option value="Ngaoundéré">Ngaoundéré (Adamaoua)</option>
                  </select>
                </div>

                <Input
                  label="Quartier / Secteur"
                  placeholder="ex: Bonapriso, Bastos, Akwa, Makepe"
                  value={shippingAddress.neighborhood}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, neighborhood: e.target.value })}
                  required
                />

                <div style={{ gridColumn: '1 / -1' }}>
                  <Input
                    label="Repère précis pour le coursier"
                    placeholder="ex: Face Boulangerie Zépol, portail noir en fer forgé"
                    value={shippingAddress.landmark}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, landmark: e.target.value })}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <Input
                    label="Consignes spécifiques de livraison"
                    placeholder="ex: Appeler 15 min avant l'arrivée, laisser au concierge si absent"
                    value={shippingAddress.additional_instructions}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, additional_instructions: e.target.value })}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                  <Button type="button" variant="outline" size="lg" onClick={() => setCurrentStep(1)}>
                    &larr; Retour
                  </Button>
                  <Button type="submit" variant="primary" size="lg" fullWidth>
                    Choisir le Mode de Livraison &rarr;
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Delivery Method */}
          {currentStep === 3 && (
            <div className={styles.cardSection}>
              <h2 className={styles.sectionTitle}>
                <Truck size={20} />
                <span>Étape 3 : Mode de Livraison</span>
              </h2>
              <p className={styles.sectionSubtitle}>
                Sélectionnez le type d'acheminement sécurisé pour vos pièces d'horlogerie et joaillerie.
              </p>

              <div>
                <div
                  className={`${styles.deliveryOptionCard} ${deliveryMethod === 'DOORSTEP_EXPRESS' ? styles.deliveryOptionSelected : ''}`}
                  onClick={() => setDeliveryMethod('DOORSTEP_EXPRESS')}
                >
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
                      Livraison Express à Domicile (Douala & Yaoundé)
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-muted-grey)' }}>
                      Remise en mains propres sécurisée contre signature sous 24h à 48h.
                    </p>
                  </div>
                  <strong style={{ fontSize: '1rem', color: subtotal >= 150000 ? 'var(--color-success)' : 'var(--color-charcoal)' }}>
                    {subtotal >= 150000 ? 'GRATUIT' : `${formatFCFA(shippingAddress.city.toLowerCase().includes('yaound') ? 3000 : 2000)}`}
                  </strong>
                </div>

                <div
                  className={`${styles.deliveryOptionCard} ${deliveryMethod === 'AGENCY_PICKUP' ? styles.deliveryOptionSelected : ''}`}
                  onClick={() => setDeliveryMethod('AGENCY_PICKUP')}
                >
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
                      Retrait en Agence de Transport VIP (Interurbain)
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-muted-grey)' }}>
                      Colis scellé acheminé via Touristique Express, Buca Voyages ou Finexs VIP.
                    </p>
                  </div>
                  <strong style={{ fontSize: '1rem', color: subtotal >= 150000 ? 'var(--color-success)' : 'var(--color-charcoal)' }}>
                    {subtotal >= 150000 ? 'GRATUIT' : '1 500 FCFA'}
                  </strong>
                </div>

                <div
                  className={`${styles.deliveryOptionCard} ${deliveryMethod === 'SHOWROOM_COLLECTION' ? styles.deliveryOptionSelected : ''}`}
                  onClick={() => setDeliveryMethod('SHOWROOM_COLLECTION')}
                >
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
                      Retrait Privilège en Boutique Showroom FARÉL
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-muted-grey)' }}>
                      Accueil personnalisé et essayage en boutique à Douala Bonapriso.
                    </p>
                  </div>
                  <strong style={{ fontSize: '1rem', color: 'var(--color-success)' }}>
                    OFFERT
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
                <Button type="button" variant="outline" size="lg" onClick={() => setCurrentStep(2)}>
                  &larr; Retour
                </Button>
                <Button type="button" variant="primary" size="lg" fullWidth onClick={handleNextStep}>
                  Procéder au Paiement ({formatFCFA(grandTotal)}) &rarr;
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Payment Selection */}
          {currentStep === 4 && (
            <div className={styles.cardSection}>
              <h2 className={styles.sectionTitle}>
                <CreditCard size={20} />
                <span>Étape 4 : Paiement Sécurisé</span>
              </h2>
              <p className={styles.sectionSubtitle}>
                Toutes les transactions sont chiffrées en 256 bits et protégées par notification USSD ou 3D-Secure.
              </p>

              <div className={styles.paymentGrid}>
                {/* MTN MoMo */}
                <div
                  className={`${styles.paymentMethodCard} ${paymentMethod === 'MTN_MOMO' ? styles.paymentMethodSelected : ''}`}
                  onClick={() => setPaymentMethod('MTN_MOMO')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#FFCC00', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                      MTN
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>MTN Mobile Money Cameroun</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-muted-grey)' }}>
                        Validation instantanée par invite USSD (*126#)
                      </div>
                    </div>
                  </div>
                  <input type="radio" checked={paymentMethod === 'MTN_MOMO'} readOnly />
                </div>

                {/* Orange Money */}
                <div
                  className={`${styles.paymentMethodCard} ${paymentMethod === 'ORANGE_MONEY' ? styles.paymentMethodSelected : ''}`}
                  onClick={() => setPaymentMethod('ORANGE_MONEY')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#FF6600', color: '#FFF', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                      OM
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>Orange Money Cameroun</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-muted-grey)' }}>
                        Validation via code secret #150*4*4#
                      </div>
                    </div>
                  </div>
                  <input type="radio" checked={paymentMethod === 'ORANGE_MONEY'} readOnly />
                </div>

                {/* Card Stripe */}
                <div
                  className={`${styles.paymentMethodCard} ${paymentMethod === 'CARD_STRIPE' ? styles.paymentMethodSelected : ''}`}
                  onClick={() => setPaymentMethod('CARD_STRIPE')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#1A1F71', color: '#FFF', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                      VISA
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>Carte Bancaire (Visa / Mastercard)</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-muted-grey)' }}>
                        Paiement international sécurisé 3D-Secure
                      </div>
                    </div>
                  </div>
                  <input type="radio" checked={paymentMethod === 'CARD_STRIPE'} readOnly />
                </div>

                {/* Cash on Delivery */}
                <div
                  className={`${styles.paymentMethodCard} ${paymentMethod === 'CASH_ON_DELIVERY' ? styles.paymentMethodSelected : ''}`}
                  onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#2E7D32', color: '#FFF', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                      CASH
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>Paiement à la Livraison</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-muted-grey)' }}>
                        Réglez en mains propres au coursier à Douala ou Yaoundé
                      </div>
                    </div>
                  </div>
                  <input type="radio" checked={paymentMethod === 'CASH_ON_DELIVERY'} readOnly />
                </div>

                {/* Bank Transfer */}
                <div
                  className={`${styles.paymentMethodCard} ${paymentMethod === 'BANK_TRANSFER' ? styles.paymentMethodSelected : ''}`}
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#C6A15B', color: '#FFF', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                      RIB
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>Virement Bancaire Commercial</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-muted-grey)' }}>
                        Compte professionnel Afriland First Bank Cameroun
                      </div>
                    </div>
                  </div>
                  <input type="radio" checked={paymentMethod === 'BANK_TRANSFER'} readOnly />
                </div>
              </div>

              {(paymentMethod === 'MTN_MOMO' || paymentMethod === 'ORANGE_MONEY') && (
                <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', backgroundColor: 'var(--color-cream-subtle)', border: '1px solid var(--color-border-grey)' }}>
                  <Input
                    label={`Numéro de téléphone ${paymentMethod === 'MTN_MOMO' ? 'MTN' : 'Orange'} pour le débit`}
                    placeholder="ex: +237 6XXXXXXXX"
                    value={momoPhone}
                    onChange={(e) => setMomoPhone(e.target.value)}
                    helperText="Une notification USSD push apparaîtra instantanément sur cet appareil pour confirmation."
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
                <Button type="button" variant="outline" size="lg" onClick={() => setCurrentStep(3)}>
                  &larr; Retour
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                  onClick={handleFinalOrderSubmit}
                >
                  Confirmer et Régler {formatFCFA(grandTotal)}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: Order Confirmation Screen */}
          {currentStep === 5 && confirmedOrder && (
            <div className={styles.cardSection} style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-xl)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(46, 125, 50, 0.1)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-md)' }}>
                <CheckCircle size={36} />
              </div>

              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--color-charcoal)', marginBottom: 'var(--space-xs)' }}>
                Commande Validée avec Succès
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-muted-grey)', marginBottom: 'var(--space-xl)' }}>
                Merci pour votre confiance. La Maison FARÉL prépare dès à présent votre écrin avec le plus grand soin.
              </p>

              {/* Order Reference Box */}
              <div style={{ backgroundColor: 'var(--color-cream-subtle)', border: '1px solid var(--color-champagne-gold)', padding: 'var(--space-lg)', maxWidth: '440px', margin: '0 auto var(--space-2xl)' }}>
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted-grey)', marginBottom: '4px' }}>
                  Référence de Commande
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-charcoal)' }}>
                  {confirmedOrder.order_number}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-champagne-gold)', marginTop: '4px', fontWeight: 600 }}>
                  Statut : {confirmedOrder.payment_status === 'PAID' ? 'RÈGLEMENT CONFIRMÉ' : 'EN ATTENTE DE PAIEMENT'}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                <Link to={`/track-order/${confirmedOrder.order_number}`}>
                  <Button variant="primary" size="lg">
                    Suivre Ma Commande en Direct
                  </Button>
                </Link>
                <Link to="/catalog">
                  <Button variant="outline" size="lg">
                    Poursuivre mes Découvertes
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Summary Sidebar */}
        {currentStep < 5 && (
          <aside className={styles.summarySidebar}>
            <h3 className={styles.summaryTitle}>Votre Commande ({items.length})</h3>

            <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: 'var(--space-md)' }}>
              {items.map((it) => (
                <div key={it.variantId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.88rem' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{it.productName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-grey)' }}>
                      Qté: {it.quantity} × {formatFCFA(it.price)}
                    </div>
                  </div>
                  <div>{formatFCFA(it.price * it.quantity)}</div>
                </div>
              ))}
            </div>

            <div className={styles.summaryRow}>
              <span>Sous-total :</span>
              <span>{formatFCFA(subtotal)}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Frais de livraison :</span>
              <span>{deliveryFee === 0 ? 'Offerte (0 FCFA)' : formatFCFA(deliveryFee)}</span>
            </div>

            <div className={styles.totalRow}>
              <span>Total à régler :</span>
              <span style={{ color: 'var(--color-champagne-gold)' }}>{formatFCFA(grandTotal)}</span>
            </div>

            <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-sm)', backgroundColor: 'var(--color-cream-subtle)', fontSize: '0.78rem', color: 'var(--color-muted-grey)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} style={{ color: 'var(--color-champagne-gold)', flexShrink: 0 }} />
              <span>Garantie Authenticité & Écrin Prestige FARÉL inclus.</span>
            </div>
          </aside>
        )}
      </div>

      {/* Interactive USSD Notification Modal for MoMo / Orange */}
      {pendingTx && (
        <div className={styles.ussdModal}>
          <div className={styles.ussdCard}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(198, 161, 91, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-md)' }}>
              <Smartphone size={28} style={{ color: 'var(--color-champagne-gold)' }} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: 'var(--space-xs)' }}>
              Validation sur votre Mobile
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-charcoal)', lineHeight: 1.5, marginBottom: 'var(--space-lg)' }}>
              {ussdInstructions}
            </p>

            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted-grey)', marginBottom: 'var(--space-lg)' }}>
              Réf Transaction : <strong>{pendingTx.transaction_reference}</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <Button
                variant="primary"
                size="md"
                isLoading={isVerifying}
                onClick={handleVerifyPayment}
                fullWidth
              >
                J'ai validé mon code secret PIN
              </Button>

              {/* Dev Simulation Button */}
              <button
                type="button"
                onClick={handleSimulateUssdSuccess}
                style={{
                  background: 'none',
                  border: '1px dashed var(--color-champagne-gold)',
                  color: 'var(--color-charcoal)',
                  padding: '8px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  borderRadius: '2px',
                }}
              >
                Simuler l'approbation USSD (Mode Démo)
              </button>

              <button
                type="button"
                onClick={() => setPendingTx(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-muted-grey)', fontSize: '0.8rem', cursor: 'pointer', marginTop: '6px' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
