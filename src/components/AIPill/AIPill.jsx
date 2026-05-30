import { useState } from 'react';
import styles from './AIPill.module.css';

export default function AIPill({ placeholder = "Ask ShopMind AI anything..." }) {
  const [value, setValue] = useState('');

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.pill} ai-pill glass`}>
        <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>auto_awesome</span>
        <input
          className={styles.input}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className={styles.sendBtn} aria-label="Send">
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>
    </div>
  );
}
