import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { getProductById, products } from '../../data/products';
import ProductCard from '../../components/ProductCard/ProductCard';
import styles from './ProductDetail.module.css';

const TABS = ['Description', 'Specifications', 'Reviews'];

export default function ProductDetail() {
  const { id } = useParams();
  const product = getProductById(id) || products[0];
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'One Size');
  const [activeTab, setActiveTab] = useState('Description');
  const [qty, setQty] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const wishlisted = isInWishlist(product.id);
  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product, selectedSize, qty);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const priceBarData = [50, 65, 80, 75, 40, 30];

  return (
    <div className={`${styles.page} page-enter`}>
      <div className="noise-overlay" />

      <main className={styles.main}>
        <div className={styles.grid}>
          {/* ── Gallery ── */}
          <section className={styles.gallery}>
            <div className={`${styles.mainImage} glass`}>
              <img src={product.image} alt={product.name} className={styles.mainImg} />
            </div>
            <div className={styles.thumbGrid}>
              {[product.image, product.image, product.image, product.image].map((img, i) => (
                <div key={i} className={`${styles.thumb} ${i === 0 ? styles.thumbActive : ''}`}>
                  <img src={img} alt={`View ${i + 1}`} className={styles.thumbImg} />
                </div>
              ))}
            </div>
          </section>

          {/* ── Info ── */}
          <section className={styles.info}>
            {/* Brand & Title */}
            <div className={styles.titleGroup}>
              <p className={styles.brand}>{product.brand}</p>
              <h1 className={styles.title}>{product.name}</h1>
              <div className={styles.ratingRow}>
                <div className={styles.stars}>
                  {[1,2,3,4].map((s) => (
                    <span key={s} className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-tertiary)', fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-tertiary)', fontVariationSettings: "'FILL' 0.5" }}>star_half</span>
                </div>
                <span className={styles.reviewCount}>({product.reviewCount} Verified Reviews)</span>
              </div>
            </div>

            {/* Price */}
            <div className={styles.priceRow}>
              <span className={styles.price}>${product.price.toFixed(2)}</span>
              {product.originalPrice > product.price && (
                <>
                  <span className={styles.originalPrice}>${product.originalPrice.toFixed(2)}</span>
                  <span className={styles.saveBadge}>SAVE {product.discount}%</span>
                </>
              )}
            </div>

            {/* Price Intelligence */}
            <div className={`${styles.priceIntel} glass`}>
              <div className={styles.priceIntelHeader}>
                <div className={styles.priceIntelLeft}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-tertiary)', fontSize: '20px' }}>monitoring</span>
                  <span className={styles.priceIntelLabel}>PRICE INTELLIGENCE</span>
                </div>
                <span className={styles.priceIntelStatus}>Great time to buy</span>
              </div>
              <div className={styles.priceBar}>
                {priceBarData.map((h, i) => (
                  <div
                    key={i}
                    className={styles.priceBarCol}
                    style={{
                      height: `${h}%`,
                      background: i === priceBarData.length - 1 ? 'var(--color-primary)' : i === priceBarData.length - 2 ? 'rgba(192,193,255,0.4)' : 'var(--color-surface-variant)',
                    }}
                  />
                ))}
              </div>
              <p className={styles.priceIntelText}>Price is currently 12% lower than the 90-day average. AI predicts a stable price for the next 14 days.</p>
            </div>

            {/* Color */}
            <div className={styles.variantGroup}>
              <label className={styles.variantLabel}>COLOR: {product.color?.toUpperCase()}</label>
              <div className={styles.colorDots}>
                {['#33353a', '#ffb2b7', '#4edea3'].map((c, i) => (
                  <button key={i} className={`${styles.colorDot} ${i === 0 ? styles.colorDotActive : ''}`}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: c }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className={styles.variantGroup}>
              <div className={styles.sizeHeader}>
                <label className={styles.variantLabel}>SELECT SIZE</label>
                <button className={styles.sizeGuide}>Size Guide</button>
              </div>
              <div className={styles.sizeGrid}>
                {(product.sizes || ['One Size']).map((size) => (
                  <button
                    key={size}
                    className={`${styles.sizeBtn} ${selectedSize === size ? styles.sizeBtnActive : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty + Actions */}
            <div className={styles.qtyRow}>
              <div className={styles.qtyControl}>
                <button className={styles.qtyBtn} onClick={() => setQty(Math.max(1, qty - 1))}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>remove</span>
                </button>
                <span className={styles.qtyVal}>{qty}</span>
                <button className={styles.qtyBtn} onClick={() => setQty(qty + 1)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                </button>
              </div>
              <button
                className={`${styles.wishlistBtn} ${wishlisted ? styles.wishlistBtnActive : ''}`}
                onClick={() => toggleWishlist(product)}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: wishlisted ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
              </button>
            </div>

            <div className={styles.actions}>
              <button className={`${styles.addToCartBtn} btn-press`} onClick={handleAddToCart}>
                {addedFeedback ? (
                  <><span className="material-symbols-outlined">check</span> Added to Cart</>
                ) : (
                  <><span className="material-symbols-outlined">shopping_bag</span> Add to Cart</>
                )}
              </button>
              <Link to="/checkout" className={`${styles.buyNowBtn} btn-press`}>Buy Now</Link>
            </div>

            {/* AI Insight */}
            <div className={`${styles.aiInsight} glass`}>
              <div className={styles.aiInsightHeader}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <h3 className={styles.aiInsightTitle}>Why you'll love this</h3>
              </div>
              <ul className={styles.aiInsightList}>
                {[
                  { title: 'Adaptive Cushioning', text: 'AI-modeled lattice sole provides 40% more energy return during high-intensity intervals.' },
                  { title: 'Breathability Matrix', text: 'Precision-vented mesh keeps temperature 2°C lower than standard knit.' },
                  { title: 'Eco-Tech', text: 'Crafted with 60% recycled carbon-captured polymers without compromising durability.' },
                ].map((item) => (
                  <li key={item.title} className={styles.aiInsightItem}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-tertiary)', fontSize: '20px', flexShrink: 0 }}>check_circle</span>
                    <p className={styles.aiInsightText}><strong style={{ color: 'var(--color-on-surface)' }}>{item.title}:</strong> {item.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* ── Tabs ── */}
        <section className={styles.tabs}>
          <div className={styles.tabNav}>
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}{tab === 'Reviews' ? ` (${product.reviewCount})` : ''}
              </button>
            ))}
          </div>
          <div className={styles.tabContent}>
            {activeTab === 'Description' && (
              <div className={styles.descGrid}>
                <div>
                  <p className={styles.descText}>{product.description}</p>
                  <p className={styles.descText} style={{ marginTop: 'var(--space-md)' }}>
                    Each piece features a serialized NFC chip that unlocks a digital twin for your meta-portfolio, bridging the gap between physical reality and high-fidelity digital presence.
                  </p>
                </div>
                <div className={styles.specGrid}>
                  {[
                    { label: 'MATERIALS', value: 'Recycled Carbon Polymer' },
                    { label: 'WEIGHT', value: '240g (Size M)' },
                    { label: 'ORIGIN', value: 'Designed in Tokyo, AI Optimized' },
                    { label: 'EDITION', value: 'Limited 001' },
                  ].map((s) => (
                    <div key={s.label} className={styles.specItem}>
                      <span className={styles.specLabel}>{s.label}</span>
                      <p className={styles.specValue}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'Specifications' && (
              <div className={styles.specGrid}>
                {[
                  { label: 'MATERIALS', value: 'Recycled Carbon Polymer' },
                  { label: 'WEIGHT', value: '240g (Size M)' },
                  { label: 'ORIGIN', value: 'Designed in Tokyo, AI Optimized' },
                  { label: 'EDITION', value: 'Limited 001' },
                  { label: 'CATEGORY', value: product.category },
                  { label: 'BRAND', value: product.brand },
                ].map((s) => (
                  <div key={s.label} className={styles.specItem}>
                    <span className={styles.specLabel}>{s.label}</span>
                    <p className={styles.specValue}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'Reviews' && (
              <div className={styles.reviewsPlaceholder}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-primary)' }}>rate_review</span>
                <p>{product.reviewCount} verified reviews — 4.5 average rating</p>
              </div>
            )}
          </div>
        </section>

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <section className={styles.related}>
            <h2 className={styles.relatedTitle}>You May Also Like</h2>
            <div className={styles.relatedGrid}>
              {related.map((p) => <ProductCard key={p.id} product={p} badge={p.tags[0]} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
