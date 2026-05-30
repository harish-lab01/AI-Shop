import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import styles from './CartIcon.module.css';

export default function CartIcon() {
  const { cartCount } = useCart();
  return (
    <Link to="/cart" className={styles.wrapper} aria-label="Cart">
      <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>shopping_bag</span>
      {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
    </Link>
  );
}
