import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import SearchBar from '../SearchBar/SearchBar';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { cartCount } = useCart();
  const { wishlistItems } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.navbar}>
      {/* Left: Logo + Nav */}
      <div className={styles.left}>
        <Link to="/" className={styles.logo}>ShopMind AI</Link>
        <nav className={styles.navLinks}>
          <Link to="/shop" className={styles.navLink}>Collections</Link>
          <Link to="/shop" className={styles.navLink}>New Arrivals</Link>
          <Link to="/shop" className={`${styles.navLink} ${styles.navLinkActive}`}>AI Curations</Link>
          <Link to="/shop" className={styles.navLink}>Brands</Link>
        </nav>
      </div>

      {/* Center: Search */}
      <div className={styles.searchWrap}>
        <SearchBar variant="navbar" placeholder="Search products, brands..." />
      </div>

      {/* Right: Icons */}
      <div className={styles.right}>
        <Link to="/wishlist" className={styles.iconBtn} aria-label="Wishlist">
          <span className="material-symbols-outlined">favorite</span>
          {wishlistItems.length > 0 && (
            <span className={styles.badge}>{wishlistItems.length}</span>
          )}
        </Link>

        <Link to="/cart" className={styles.iconBtn} aria-label="Cart">
          <span className="material-symbols-outlined">shopping_bag</span>
          {cartCount > 0 && (
            <span className={styles.badge}>{cartCount}</span>
          )}
        </Link>

        <Link to="/dashboard" className={styles.iconBtn} aria-label="Dashboard">
          <span className="material-symbols-outlined">person</span>
        </Link>

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
          <div className={styles.mobileSearch}>
            <SearchBar variant="navbar" placeholder="Search..." />
          </div>
          <Link to="/shop"      onClick={() => setMenuOpen(false)}>Collections</Link>
          <Link to="/shop"      onClick={() => setMenuOpen(false)}>New Arrivals</Link>
          <Link to="/shop"      onClick={() => setMenuOpen(false)}>AI Curations</Link>
          <Link to="/shop"      onClick={() => setMenuOpen(false)}>Brands</Link>
          <Link to="/wishlist"  onClick={() => setMenuOpen(false)}>Wishlist ({wishlistItems.length})</Link>
          <Link to="/cart"      onClick={() => setMenuOpen(false)}>Cart ({cartCount})</Link>
          <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
        </div>
      )}
    </header>
  );
}
