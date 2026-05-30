import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import styles from './ProductCard.module.css';

export default function ProductCard({ product, badge }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wishlisted = isInWishlist(product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, product.sizes?.[0] || 'One Size');
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <Link to={`/product/${product.id}`} className={`${styles.card} product-card`}>
      <div className={styles.imageWrapper}>
        <img
          src={product.image}
          alt={product.name}
          className={styles.image}
          loading="lazy"
        />

        {/* Badge */}
        {badge && (
          <span className={`${styles.badge} ${styles[`badge${badge.replace(/\s+/g, '')}`] || styles.badgeDefault}`}>
            {badge}
          </span>
        )}

        {/* Wishlist Button */}
        <button
          className={`${styles.wishlistBtn} heart-pulse`}
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <span
            className="material-symbols-outlined mat-icon"
            style={{
              fontVariationSettings: wishlisted ? "'FILL' 1" : "'FILL' 0",
              color: wishlisted ? 'var(--color-secondary)' : 'inherit',
            }}
          >
            favorite
          </span>
        </button>

        {/* Quick Add Overlay */}
        <div className={styles.overlay}>
          <button className={styles.quickAddBtn} onClick={handleAddToCart}>
            Quick Add
          </button>
        </div>
      </div>

      <div className={styles.info}>
        <div className={styles.namePrice}>
          <h3 className={styles.name}>{product.name}</h3>
          <div className={styles.priceGroup}>
            <span className={styles.price}>${product.price.toFixed(2)}</span>
            {product.originalPrice > product.price && (
              <span className={styles.originalPrice}>${product.originalPrice.toFixed(2)}</span>
            )}
          </div>
        </div>
        <p className={styles.color}>{product.color}</p>
        {product.rating && (
          <div className={styles.rating}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--color-tertiary)', fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className={styles.ratingVal}>{product.rating}</span>
            <span className={styles.reviewCount}>({product.reviewCount})</span>
          </div>
        )}
      </div>
    </Link>
  );
}
