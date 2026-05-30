import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import AIPill from '../../components/AIPill/AIPill';
import styles from './Wishlist.module.css';

export default function Wishlist() {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = (item) => {
    addToCart(item, item.sizes?.[0] || 'One Size');
    removeFromWishlist(item.id);
  };

  return (
    <div className={`${styles.page} page-enter`}>
      <div className="noise-overlay" />

      <main className={styles.main}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <div>
            <span className={styles.headerLabel}>PERSONAL COLLECTION</span>
            <h1 className={styles.headerTitle}>My Wishlist</h1>
            <p className={styles.headerSub}>
              A curated selection of your favorite pieces, powered by AI to track price movements and availability.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.shareBtn}>
              <span className="material-symbols-outlined">share</span>
              Share Wishlist
            </button>
            <button
              className={styles.addAllBtn}
              onClick={() => wishlistItems.forEach((item) => addToCart(item, item.sizes?.[0] || 'One Size'))}
            >
              <span className="material-symbols-outlined">add_shopping_cart</span>
              Add All to Cart
            </button>
          </div>
        </header>

        {/* ── Grid ── */}
        {wishlistItems.length === 0 ? (
          <div className={styles.empty}>
            <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--color-on-surface-variant)' }}>favorite_border</span>
            <h2 className={styles.emptyTitle}>Your wishlist is empty</h2>
            <p className={styles.emptyText}>Save items you love and track their prices with AI.</p>
            <Link to="/shop" className={styles.shopBtn}>Explore Collections</Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {wishlistItems.map((item) => (
              <div key={item.id} className={`${styles.card} glass`}>
                <div className={styles.cardImage}>
                  <img src={item.image} alt={item.name} className={styles.cardImg} />
                  {item.discount > 0 && (
                    <div className={styles.priceDrop}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_down</span>
                      Price Dropped {item.discount}%
                    </div>
                  )}
                </div>
                <div className={styles.cardInfo}>
                  <div className={styles.cardTop}>
                    <div>
                      <p className={styles.cardBrand}>{item.brand}</p>
                      <h3 className={styles.cardName}>{item.name}</h3>
                    </div>
                    <span className={styles.cardPrice}>${item.price}</span>
                  </div>
                  <div className={styles.cardActions}>
                    <button className={styles.moveToCartBtn} onClick={() => handleMoveToCart(item)}>
                      Move to Cart
                    </button>
                    <button className={styles.deleteBtn} onClick={() => removeFromWishlist(item.id)}>
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* AI Suggestion Card */}
            <div className={styles.aiCard}>
              <div className={styles.aiCardIcon}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '32px' }}>auto_awesome</span>
              </div>
              <div className={styles.aiCardContent}>
                <h3 className={styles.aiCardTitle}>AI Curations</h3>
                <p className={styles.aiCardText}>Discover items similar to your wishlist curated by our intelligent engine.</p>
              </div>
              <Link to="/shop" className={styles.aiCardBtn}>Explore Now</Link>
            </div>
          </div>
        )}
      </main>

      <AIPill placeholder="Ask AI to find matching accessories for your wishlist..." />
    </div>
  );
}
