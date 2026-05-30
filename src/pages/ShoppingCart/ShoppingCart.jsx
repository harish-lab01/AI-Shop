import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { products } from '../../data/products';
import AIPill from '../../components/AIPill/AIPill';
import styles from './ShoppingCart.module.css';

const UPSELL = products.slice(0, 3);

export default function ShoppingCart() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
  const tax = cartTotal * 0.08;
  const total = cartTotal + tax;
  const freeShippingThreshold = 500;
  const progress = Math.min((cartTotal / freeShippingThreshold) * 100, 100);

  return (
    <div className={`${styles.page} page-enter`}>
      <div className="noise-overlay" />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Your Curated Selection</h1>
          <p className={styles.subtitle}>Refining your style with intelligent precision.</p>
        </div>

        {cartItems.length === 0 ? (
          <div className={styles.empty}>
            <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--color-on-surface-variant)' }}>shopping_bag</span>
            <h2 className={styles.emptyTitle}>Your cart is empty</h2>
            <p className={styles.emptyText}>Discover AI-curated pieces made for you.</p>
            <Link to="/shop" className={styles.shopBtn}>Explore Collections</Link>
          </div>
        ) : (
          <div className={styles.layout}>
            {/* ── Items ── */}
            <div className={styles.items}>
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.size}`} className={`${styles.cartItem} glass`}>
                  <div className={styles.itemImage}>
                    <img src={item.image} alt={item.name} className={styles.itemImg} />
                  </div>
                  <div className={styles.itemDetails}>
                    <div className={styles.itemTop}>
                      <div>
                        <h3 className={styles.itemName}>{item.name}</h3>
                        <p className={styles.itemMeta}>{item.color} / {item.size}</p>
                      </div>
                      <span className={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className={styles.itemBottom}>
                      <div className={styles.qtyControl}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>remove</span>
                        </button>
                        <span className={styles.qtyVal}>{String(item.quantity).padStart(2, '0')}</span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                        </button>
                      </div>
                      <div className={styles.itemActions}>
                        <button className={styles.saveLaterBtn}>SAVE FOR LATER</button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => removeFromCart(item.id, item.size)}
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* ── Complete the Look ── */}
              <section className={styles.upsell}>
                <div className={styles.upsellHeader}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-tertiary)', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <h2 className={styles.upsellTitle}>Complete the Look</h2>
                </div>
                <div className={styles.upsellGrid}>
                  {UPSELL.map((p) => (
                    <div key={p.id} className={`${styles.upsellCard} glass`}>
                      <img src={p.image} alt={p.name} className={styles.upsellImg} />
                      <div className={styles.upsellInfo}>
                        <p className={styles.upsellName}>{p.name}</p>
                        <span className={styles.upsellPrice}>${p.price}</span>
                      </div>
                      <button
                        className={styles.upsellAddBtn}
                        onClick={() => {}}
                      >
                        ADD TO CART
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* ── Summary ── */}
            <div className={styles.summary}>
              <div className={`${styles.summaryCard} glass`}>
                <h2 className={styles.summaryTitle}>Order Summary</h2>

                {/* Shipping Progress */}
                <div className={styles.shippingProgress}>
                  <div className={styles.shippingProgressHeader}>
                    <span className={styles.shippingLabel}>Shipping Progress</span>
                    <span className={styles.shippingStatus} style={{ color: progress >= 100 ? 'var(--color-tertiary)' : 'var(--color-on-surface-variant)' }}>
                      {progress >= 100 ? 'Free Shipping Reached' : `$${(freeShippingThreshold - cartTotal).toFixed(0)} away from free shipping`}
                    </span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${progress}%`, background: progress >= 100 ? 'var(--color-tertiary)' : 'var(--color-primary)' }}
                    />
                  </div>
                </div>

                <div className={styles.summaryLines}>
                  <div className={styles.summaryLine}>
                    <span>Subtotal</span>
                    <span className={styles.summaryVal}>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className={styles.summaryLine}>
                    <span>Estimated Shipping</span>
                    <span className={styles.summaryVal} style={{ color: progress >= 100 ? 'var(--color-tertiary)' : 'inherit' }}>
                      {progress >= 100 ? 'FREE' : '$15.00'}
                    </span>
                  </div>
                  <div className={styles.summaryLine}>
                    <span>Estimated Tax</span>
                    <span className={styles.summaryVal}>${tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className={styles.summaryTotal}>
                  <span className={styles.summaryTotalLabel}>Total</span>
                  <span className={styles.summaryTotalVal}>${total.toFixed(2)}</span>
                </div>

                {/* Promo */}
                <div className={styles.promoRow}>
                  <label className={styles.promoLabel}>Promo Code</label>
                  <div className={styles.promoInput}>
                    <input type="text" placeholder="Enter code" className={styles.promoField} />
                    <button className={styles.promoApply}>APPLY</button>
                  </div>
                </div>

                <Link to="/checkout" className={styles.checkoutBtn}>
                  Proceed to Checkout
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
                </Link>

                <div className={styles.paymentIcons}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', opacity: 0.4 }}>contactless</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', opacity: 0.4 }}>credit_card</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', opacity: 0.4 }}>account_balance_wallet</span>
                </div>
              </div>

              {/* AI Tip */}
              <div className={`${styles.aiTip} glass`}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1", flexShrink: 0 }}>lightbulb</span>
                <p className={styles.aiTipText}>
                  "I've noticed these items frequently sell out during weekend peaks. Completing your order now ensures guaranteed availability."
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <AIPill placeholder="Ask AI about sizing or shipping..." />
    </div>
  );
}
