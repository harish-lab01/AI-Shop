import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { cartCount } = useCart();
  const { wishlistItems } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) navigate('/shop');
  };

  return (
    <header className={styles.navbar}>
      {/* Logo */}
      <div className={styles.left}>
        <Link to="/" className={styles.logo}>ShopMind AI</Link>
        <nav className={styles.navLinks}>
          <Link to="/shop" className={styles.navLink}>Collections</Link>
          <Link to="/shop" className={styles.navLink}>New Arrivals</Link>
          <Link to="/shop" className={`${styles.navLink} ${styles.navLinkActive}`}>AI Curations</Link>
          <Link to="/shop" className={styles.navLink}>Brands</Link>
        </nav>
      </div>

      {/* Right Actions */}
      <div className={styles.right}>
        {/* Search */}
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-on-surface-variant)', fontSize: '20px' }}>search</span>
          <input
            className={styles.searchInput}
            placeholder="Search with AI..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
        </form>

        {/* Wishlist */}
        <Link to="/wishlist" className={styles.iconBtn} aria-label="Wishlist">
          <span className="material-symbols-outlined">favorite</span>
          {wishlistItems.length > 0 && (
            <span className={styles.badge}>{wishlistItems.length}</span>
          )}
        </Link>

        {/* Cart */}
        <Link to="/cart" className={styles.iconBtn} aria-label="Cart">
          <span className="material-symbols-outlined">shopping_bag</span>
          {cartCount > 0 && (
            <span className={styles.badge}>{cartCount}</span>
          )}
        </Link>

        {/* User */}
        <Link to="/dashboard" className={styles.iconBtn} aria-label="Dashboard">
          <span className="material-symbols-outlined">person</span>
        </Link>

        {/* Mobile Menu Toggle */}
        <button
          className={styles.mobileMenuBtn}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/shop" onClick={() => setMenuOpen(false)}>Collections</Link>
          <Link to="/shop" onClick={() => setMenuOpen(false)}>New Arrivals</Link>
          <Link to="/shop" onClick={() => setMenuOpen(false)}>AI Curations</Link>
          <Link to="/shop" onClick={() => setMenuOpen(false)}>Brands</Link>
          <Link to="/wishlist" onClick={() => setMenuOpen(false)}>Wishlist ({wishlistItems.length})</Link>
          <Link to="/cart" onClick={() => setMenuOpen(false)}>Cart ({cartCount})</Link>
          <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
        </div>
      )}
    </header>
  );
}
