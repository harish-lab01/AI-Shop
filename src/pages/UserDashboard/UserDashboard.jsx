import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { products } from '../../data/products';
import AIPill from '../../components/AIPill/AIPill';
import styles from './UserDashboard.module.css';

const TABS = ['overview', 'orders', 'wishlist', 'ai_preferences', 'settings'];
const TAB_LABELS = { overview: 'Overview', orders: 'Orders', wishlist: 'Wishlist', ai_preferences: 'AI Preferences', settings: 'Settings' };
const TAB_ICONS = { overview: 'dashboard', orders: 'shopping_cart', wishlist: 'favorite', ai_preferences: 'psychology', settings: 'settings' };

const ORDERS = [
  { id: '#SM-94021', date: 'October 24, 2024', status: 'Shipped', total: '$420.00', statusColor: 'var(--color-tertiary)' },
  { id: '#SM-93812', date: 'October 18, 2024', status: 'Processing', total: '$1,250.00', statusColor: 'var(--color-on-surface-variant)' },
  { id: '#SM-93700', date: 'October 12, 2024', status: 'Delivered', total: '$85.00', statusColor: 'var(--color-primary)' },
];

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { cartCount } = useCart();
  const { wishlistItems } = useWishlist();
  const recommended = products.slice(0, 2);

  return (
    <div className={`${styles.page} page-enter`}>
      <div className="noise-overlay" />

      <div className={styles.layout}>
        {/* ── Sidebar ── */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarNav}>
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`${styles.navBtn} ${activeTab === tab ? styles.navBtnActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                <span className="material-symbols-outlined">{TAB_ICONS[tab]}</span>
                <span className={styles.navBtnLabel}>{TAB_LABELS[tab]}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* ── Main ── */}
        <main className={styles.content}>
          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <section className={styles.tabSection}>
              <header className={styles.tabHeader}>
                <h1 className={styles.tabTitle}>Welcome back, Adrian.</h1>
                <p className={styles.tabSub}>Your personalized shopping intelligence dashboard.</p>
              </header>

              {/* Stats */}
              <div className={styles.statsGrid}>
                <div className={`${styles.statCard} glass`}>
                  <div className={styles.statTop}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>receipt_long</span>
                    <span className={styles.statBadge} style={{ color: 'var(--color-tertiary)' }}>+2 this month</span>
                  </div>
                  <div>
                    <p className={styles.statLabel}>Active Orders</p>
                    <p className={styles.statVal}>12</p>
                  </div>
                </div>

                <div className={`${styles.statCard} glass`}>
                  <div className={styles.statTop}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)' }}>token</span>
                    <span className={styles.statBadge}>Elite Member</span>
                  </div>
                  <div>
                    <p className={styles.statLabel}>Mind Points</p>
                    <p className={styles.statVal}>4,850</p>
                  </div>
                </div>

                <div className={`${styles.statCard} ${styles.statCardAI} glass`}>
                  <div className={styles.statCardAIBg} />
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', position: 'relative', zIndex: 1 }}>auto_awesome</span>
                  <p className={styles.statCardAITitle}>AI Style Refresh</p>
                  <p className={styles.statCardAISub}>Ready for your weekly update</p>
                  <button className={styles.analyzeBtn}>ANALYZE NOW</button>
                </div>
              </div>

              {/* Orders + Recommendations */}
              <div className={styles.twoCol}>
                {/* Orders Table */}
                <div className={styles.ordersSection}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Recent Orders</h2>
                    <button className={styles.viewAllBtn} onClick={() => setActiveTab('orders')}>VIEW ALL</button>
                  </div>
                  <div className={`${styles.ordersTable} glass`}>
                    <table className={styles.table}>
                      <thead>
                        <tr className={styles.tableHead}>
                          <th className={styles.th}>Order ID</th>
                          <th className={styles.th}>Status</th>
                          <th className={styles.th}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ORDERS.map((order) => (
                          <tr key={order.id} className={styles.tableRow}>
                            <td className={styles.td}>{order.id}</td>
                            <td className={styles.td}>
                              <span className={styles.statusBadge} style={{ color: order.statusColor }}>
                                {order.status}
                              </span>
                            </td>
                            <td className={`${styles.td} ${styles.tdMono}`}>{order.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recommendations */}
                <div className={styles.recsSection}>
                  <h2 className={styles.sectionTitle}>Curated for You</h2>
                  <div className={styles.recsGrid}>
                    {recommended.map((p) => (
                      <Link key={p.id} to={`/product/${p.id}`} className={styles.recCard}>
                        <div className={styles.recImageWrapper}>
                          <img src={p.image} alt={p.name} className={styles.recImage} />
                          <div className={styles.recPriceBadge}>${p.price}</div>
                        </div>
                        <p className={styles.recName}>{p.name}</p>
                        <p className={styles.recMatch}>98% Style Match</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── Orders ── */}
          {activeTab === 'orders' && (
            <section className={styles.tabSection}>
              <header className={styles.tabHeader}>
                <h1 className={styles.tabTitle}>Order History</h1>
                <p className={styles.tabSub}>Track your acquisitions and managed deliveries.</p>
              </header>
              <div className={styles.orderCards}>
                {ORDERS.map((order) => (
                  <div key={order.id} className={`${styles.orderCard} glass`}>
                    <div className={styles.orderCardLeft}>
                      <div className={styles.orderIcon}>
                        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                          {order.status === 'Delivered' ? 'check_circle' : 'inventory_2'}
                        </span>
                      </div>
                      <div>
                        <h4 className={styles.orderCardId}>{order.id}</h4>
                        <p className={styles.orderCardDate}>Placed on {order.date}</p>
                      </div>
                    </div>
                    <div className={styles.orderCardRight}>
                      <span className={styles.orderStatusBadge} style={{ color: order.statusColor }}>
                        {order.status.toUpperCase()}
                      </span>
                      <p className={styles.orderCardTotal}>{order.total}</p>
                    </div>
                    <button className={styles.orderActionBtn}>
                      {order.status === 'Shipped' ? 'TRACK PACKAGE' : 'VIEW DETAILS'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Wishlist ── */}
          {activeTab === 'wishlist' && (
            <section className={styles.tabSection}>
              <header className={styles.tabHeader}>
                <h1 className={styles.tabTitle}>My Wishlist</h1>
                <p className={styles.tabSub}>{wishlistItems.length} saved items.</p>
              </header>
              {wishlistItems.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-on-surface-variant)' }}>favorite_border</span>
                  <p>No items saved yet.</p>
                  <Link to="/wishlist" className={styles.goBtn}>Go to Wishlist</Link>
                </div>
              ) : (
                <Link to="/wishlist" className={styles.goBtn}>View Full Wishlist ({wishlistItems.length} items)</Link>
              )}
            </section>
          )}

          {/* ── AI Preferences ── */}
          {activeTab === 'ai_preferences' && (
            <section className={styles.tabSection}>
              <header className={styles.tabHeader}>
                <h1 className={styles.tabTitle}>AI Style Engine</h1>
                <p className={styles.tabSub}>Fine-tune the algorithms that power your curations.</p>
              </header>
              <div className={styles.prefContent}>
                {/* Sliders */}
                <div className={`${styles.prefCard} glass`}>
                  <h3 className={styles.prefCardTitle}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>tune</span>
                    Dimensional Profile
                  </h3>
                  {[
                    { left: 'CASUAL', right: 'FORMAL', val: 65 },
                    { left: 'MINIMALIST', right: 'AVANT-GARDE', val: 25 },
                    { left: 'TECHWEAR', right: 'HERITAGE', val: 80 },
                  ].map((s) => (
                    <div key={s.left} className={styles.sliderGroup}>
                      <div className={styles.sliderLabels}>
                        <span>{s.left}</span>
                        <span>{s.right}</span>
                      </div>
                      <input type="range" min={0} max={100} defaultValue={s.val} className={styles.slider} />
                    </div>
                  ))}
                </div>

                {/* Categories */}
                <div className={`${styles.prefCard} glass`}>
                  <h3 className={styles.prefCardTitle}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)' }}>category</span>
                    Focus Categories
                  </h3>
                  <div className={styles.categoryChips}>
                    {['Outerwear', 'Footwear', 'Accessories', 'Tech Lifestyle', 'Home Studio'].map((cat, i) => (
                      <button key={cat} className={`${styles.catChip} ${i % 2 === 0 ? styles.catChipActive : ''}`}>
                        {cat}
                      </button>
                    ))}
                    <button className={styles.catChipAdd}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span> Add New
                    </button>
                  </div>
                </div>

                <div className={styles.retrainWrapper}>
                  <button className={`${styles.retrainBtn} glass`}>
                    <span className={styles.retrainLabel}>RETRAIN AI CORE</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ── Settings ── */}
          {activeTab === 'settings' && (
            <section className={styles.tabSection}>
              <header className={styles.tabHeader}>
                <h1 className={styles.tabTitle}>Settings</h1>
                <p className={styles.tabSub}>Manage your account preferences.</p>
              </header>
              <div className={styles.settingsGrid}>
                {[
                  { label: 'Full Name', val: 'Adrian Sterling', type: 'text' },
                  { label: 'Email', val: 'adrian@shopmind.ai', type: 'email' },
                  { label: 'Phone', val: '+1 (555) 000-0000', type: 'tel' },
                ].map((f) => (
                  <div key={f.label} className={styles.settingField}>
                    <label className={styles.settingLabel}>{f.label}</label>
                    <input type={f.type} defaultValue={f.val} className={styles.settingInput} />
                  </div>
                ))}
                <button className={styles.saveBtn}>Save Changes</button>
              </div>
            </section>
          )}
        </main>
      </div>

      <AIPill placeholder="Ask ShopMind AI to find something new..." />
    </div>
  );
}
