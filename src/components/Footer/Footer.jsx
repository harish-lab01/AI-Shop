import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.brand}>
          <span className={styles.brandName}>ShopMind AI</span>
          <p className={styles.brandDesc}>
            The future of high-end commerce, powered by intelligence.
          </p>
          <div className={styles.socialLinks}>
            <span className="material-symbols-outlined">language</span>
            <span className="material-symbols-outlined">shield_with_heart</span>
            <span className="material-symbols-outlined">alternate_email</span>
          </div>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Shop</h4>
          <ul className={styles.colList}>
            <li><Link to="/shop">Collections</Link></li>
            <li><Link to="/shop">New Arrivals</Link></li>
            <li><Link to="/shop">AI Curations</Link></li>
            <li><Link to="/shop">Brands</Link></li>
          </ul>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Company</h4>
          <ul className={styles.colList}>
            <li><a href="#">Sustainability</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Newsletter</h4>
          <p className={styles.newsletterDesc}>Early access to curated drops.</p>
          <div className={styles.newsletterForm}>
            <input
              type="email"
              placeholder="Email"
              className={styles.newsletterInput}
            />
            <button className={styles.newsletterBtn}>Join</button>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© 2024 ShopMind AI. Powered by Intelligence.</span>
      </div>
    </footer>
  );
}
