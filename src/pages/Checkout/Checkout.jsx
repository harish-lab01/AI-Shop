import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import styles from './Checkout.module.css';

const STEPS = ['SHIPPING', 'PAYMENT', 'REVIEW'];

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNum] = useState(() => Math.floor(10000 + Math.random() * 90000));
  const [cardFlipped, setCardFlipped] = useState(false);
  const [cardData, setCardData] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [delivery, setDelivery] = useState('standard');

  const tax = cartTotal * 0;
  const shipping = delivery === 'express' ? 25 : 0;
  const total = cartTotal + tax + shipping;

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
    clearCart();
  };

  const formatCardNum = (val) => {
    const digits = val.replace(/\D/g, '').substring(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').substring(0, 4);
    return digits.length > 2 ? digits.substring(0, 2) + '/' + digits.substring(2) : digits;
  };

  if (orderPlaced) {
    return (
      <div className={`${styles.page} page-enter`}>
        <div className="noise-overlay" />
        <div className={styles.successWrapper}>
          <div className={styles.successIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-tertiary-fixed)' }}>check_circle</span>
          </div>
          <h2 className={styles.successTitle}>Order Confirmed</h2>
          <p className={styles.successSub}>Your intelligence-curated collection is on its way.</p>
          <div className={`${styles.orderNumCard} glass`}>
            <span className={styles.orderNumLabel}>Order Number</span>
            <span className={styles.orderNum}>SM-{orderNum}</span>
          </div>
          <div className={styles.successActions}>
            <Link to="/dashboard" className={styles.trackBtn}>Track Order</Link>
            <Link to="/shop" className={styles.backBtn}>Back to Collections</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.page} page-enter`}>
      <div className="noise-overlay" />

      <main className={styles.main}>
        <div className={styles.grid}>
          {/* ── Left: Steps ── */}
          <div className={styles.left}>
            {/* Step Indicator */}
            <div className={styles.stepIndicator}>
              {STEPS.map((s, i) => (
                <div key={s} className={styles.stepGroup}>
                  <div className={`${styles.stepItem} ${i === step ? styles.stepActive : i < step ? styles.stepDone : styles.stepInactive}`}>
                    <div className={styles.stepCircle}>
                      {i < step
                        ? <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                        : <span className={styles.stepNum}>0{i + 1}</span>
                      }
                    </div>
                    <span className={styles.stepLabel}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={styles.stepLine} />}
                </div>
              ))}
            </div>

            {/* ── Step 0: Shipping ── */}
            {step === 0 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>Shipping Details</h2>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>First Name</label>
                    <input className={styles.fieldInput} placeholder="Elias" />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Last Name</label>
                    <input className={styles.fieldInput} placeholder="Sterling" />
                  </div>
                  <div className={`${styles.formField} ${styles.colSpan2}`}>
                    <label className={styles.fieldLabel}>Address</label>
                    <input className={styles.fieldInput} placeholder="88 Luxury Avenue, Floor 12" />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>City</label>
                    <input className={styles.fieldInput} placeholder="New York" />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Postal Code</label>
                    <input className={styles.fieldInput} placeholder="10001" />
                  </div>
                </div>

                <div className={styles.deliverySection}>
                  <h3 className={styles.deliveryTitle}>Delivery Method</h3>
                  <div className={styles.deliveryOptions}>
                    {[
                      { id: 'standard', label: 'Standard Delivery', sub: '3-5 Business Days', price: 'FREE' },
                      { id: 'express', label: 'Express AI Logistics', sub: 'Next Day Delivery', price: '$25.00' },
                    ].map((opt) => (
                      <label key={opt.id} className={`${styles.deliveryOption} glass ${delivery === opt.id ? styles.deliveryOptionActive : ''}`}>
                        <input
                          type="radio"
                          name="delivery"
                          value={opt.id}
                          checked={delivery === opt.id}
                          onChange={() => setDelivery(opt.id)}
                          className={styles.radioInput}
                        />
                        <div className={styles.deliveryOptionContent}>
                          <span className={styles.deliveryLabel}>{opt.label}</span>
                          <span className={styles.deliverySub}>{opt.sub}</span>
                          <span className={styles.deliveryPrice}>{opt.price}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.stepActions}>
                  <button className={styles.nextBtn} onClick={() => setStep(1)}>Continue to Payment</button>
                </div>
              </div>
            )}

            {/* ── Step 1: Payment ── */}
            {step === 1 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>Payment Method</h2>

                <div className={styles.paymentMethods}>
                  {[{ icon: 'ios', label: 'Apple Pay' }, { icon: 'payments', label: 'PayPal' }].map((m) => (
                    <button key={m.label} className={`${styles.payMethodBtn} glass`}>
                      <span className="material-symbols-outlined">{m.icon}</span>
                      <span className={styles.payMethodLabel}>{m.label}</span>
                    </button>
                  ))}
                </div>

                <div className={styles.cardSection}>
                  {/* Animated Card */}
                  <div className={`${styles.creditCard} ${cardFlipped ? styles.cardFlipped : ''}`}>
                    <div className={styles.cardInner}>
                      <div className={`${styles.cardFront} glass`}>
                        <div className={styles.cardFrontTop}>
                          <div className={styles.cardChip} />
                          <span className="material-symbols-outlined" style={{ fontSize: '32px', opacity: 0.5 }}>wifi</span>
                        </div>
                        <div className={styles.cardFrontBottom}>
                          <div className={styles.cardNumber}>{cardData.number || '•••• •••• •••• ••••'}</div>
                          <div className={styles.cardMeta}>
                            <div>
                              <div className={styles.cardMetaLabel}>Card Holder</div>
                              <div className={styles.cardMetaVal}>{cardData.name || 'YOUR NAME'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div className={styles.cardMetaLabel}>Expires</div>
                              <div className={styles.cardMetaVal}>{cardData.expiry || 'MM/YY'}</div>
                            </div>
                          </div>
                        </div>
                        <div className={styles.cardGlow} />
                      </div>
                      <div className={`${styles.cardBack} glass`}>
                        <div className={styles.cardStripe} />
                        <div className={styles.cardCvvRow}>
                          <div className={styles.cardCvv}>{cardData.cvv ? '•'.repeat(cardData.cvv.length) : '•••'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Form */}
                  <div className={styles.cardForm}>
                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>Cardholder Name</label>
                      <input
                        className={styles.fieldInput}
                        placeholder="Elias Sterling"
                        value={cardData.name}
                        onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>Card Number</label>
                      <input
                        className={styles.fieldInput}
                        placeholder="0000 0000 0000 0000"
                        value={cardData.number}
                        onChange={(e) => setCardData({ ...cardData, number: formatCardNum(e.target.value) })}
                      />
                    </div>
                    <div className={styles.formGrid2}>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Expiry</label>
                        <input
                          className={styles.fieldInput}
                          placeholder="MM/YY"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>CVV</label>
                        <input
                          className={styles.fieldInput}
                          placeholder="•••"
                          type="password"
                          value={cardData.cvv}
                          onFocus={() => setCardFlipped(true)}
                          onBlur={() => setCardFlipped(false)}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.substring(0, 4) })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.stepActions}>
                  <button className={styles.backBtn2} onClick={() => setStep(0)}>
                    <span className="material-symbols-outlined">arrow_back</span> Back to Shipping
                  </button>
                  <button className={styles.nextBtn} onClick={() => setStep(2)}>Review Order</button>
                </div>
              </div>
            )}

            {/* ── Step 2: Review ── */}
            {step === 2 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>Final Review</h2>

                <div className={styles.reviewCards}>
                  <div className={`${styles.reviewCard} glass`}>
                    <div className={styles.reviewCardHeader}>
                      <h4 className={styles.reviewCardTitle}>Shipping Address</h4>
                      <button className={styles.editBtn} onClick={() => setStep(0)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                      </button>
                    </div>
                    <p className={styles.reviewCardText}>Elias Sterling<br />88 Luxury Avenue, Floor 12<br />New York, NY 10001</p>
                  </div>
                  <div className={`${styles.reviewCard} glass`}>
                    <div className={styles.reviewCardHeader}>
                      <h4 className={styles.reviewCardTitle}>Payment Method</h4>
                      <button className={styles.editBtn} onClick={() => setStep(1)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                      </button>
                    </div>
                    <div className={styles.paymentPreview}>
                      <div className={styles.paymentPreviewIcon}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>credit_card</span>
                      </div>
                      <p className={styles.reviewCardText}>Visa ending in 4242<br />Expires 12/26</p>
                    </div>
                  </div>
                </div>

                <div className={`${styles.reviewItems} glass`}>
                  <h4 className={styles.reviewCardTitle} style={{ marginBottom: 'var(--space-lg)' }}>Items in Cart</h4>
                  {cartItems.length === 0 ? (
                    <p className={styles.reviewCardText}>No items in cart.</p>
                  ) : (
                    <div className={styles.reviewItemList}>
                      {cartItems.map((item) => (
                        <div key={`${item.id}-${item.size}`} className={styles.reviewItem}>
                          <img src={item.image} alt={item.name} className={styles.reviewItemImg} />
                          <div className={styles.reviewItemInfo}>
                            <h5 className={styles.reviewItemName}>{item.name}</h5>
                            <span className={styles.reviewItemMeta}>{item.size} × {item.quantity}</span>
                          </div>
                          <span className={styles.reviewItemPrice}>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.stepActions}>
                  <p className={styles.termsText}>
                    By placing this order, you agree to ShopMind AI's{' '}
                    <span style={{ color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span>.
                  </p>
                  <button className={`${styles.confirmBtn} btn-press`} onClick={handlePlaceOrder}>
                    <span className="material-symbols-outlined">lock</span>
                    Confirm and Pay ${total.toFixed(2)}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Summary ── */}
          <div className={styles.right}>
            <div className={`${styles.summaryCard} glass`}>
              <h3 className={styles.summaryTitle}>Summary</h3>
              <div className={styles.summaryLines}>
                <div className={styles.summaryLine}>
                  <span>Subtotal</span>
                  <span className={styles.summaryVal}>${cartTotal.toFixed(2)}</span>
                </div>
                <div className={styles.summaryLine}>
                  <span>Shipping</span>
                  <span className={styles.summaryVal}>{step === 0 ? 'Calculated next' : shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className={styles.summaryLine}>
                  <span>Tax</span>
                  <span className={styles.summaryVal}>${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className={styles.promoRow}>
                <div className={`${styles.promoInput} glass`}>
                  <input className={styles.promoField} placeholder="Promo code" />
                  <button className={styles.promoApply}>Apply</button>
                </div>
              </div>

              <div className={styles.summaryTotal}>
                <span className={styles.summaryTotalLabel}>Total</span>
                <span className={styles.summaryTotalVal}>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className={`${styles.ecoCard} glass`}>
              <div className={styles.ecoIcon}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)' }}>eco</span>
              </div>
              <div>
                <p className={styles.ecoTitle}>Carbon-Neutral Delivery</p>
                <p className={styles.ecoSub}>POWERED BY MINDGRID SUSTAINABILITY</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
