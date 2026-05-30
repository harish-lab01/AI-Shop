import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/ProductCard/ProductCard';
import { products } from '../../data/products';
import styles from './Home.module.css';

const PLACEHOLDERS = [
  "Find me a minimalist winter coat...",
  "Show me sustainable techwear brands.",
  "What should I wear to a Tokyo art gala?",
  "Find a gift for a brutalist design fan.",
  "Find me sneakers that match indigo denim.",
];

export default function Home() {
  const [placeholder, setPlaceholder] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const pIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const isDeletingRef = useRef(false);
  const timerRef = useRef(null);

  // Typewriter effect
  useEffect(() => {
    const type = () => {
      const current = PLACEHOLDERS[pIndexRef.current];
      if (isDeletingRef.current) {
        charIndexRef.current--;
        setPlaceholder(current.substring(0, charIndexRef.current));
        if (charIndexRef.current === 0) {
          isDeletingRef.current = false;
          pIndexRef.current = (pIndexRef.current + 1) % PLACEHOLDERS.length;
          timerRef.current = setTimeout(type, 500);
          return;
        }
        timerRef.current = setTimeout(type, 30);
      } else {
        charIndexRef.current++;
        setPlaceholder(current.substring(0, charIndexRef.current));
        if (charIndexRef.current === current.length) {
          isDeletingRef.current = true;
          timerRef.current = setTimeout(type, 2500);
          return;
        }
        timerRef.current = setTimeout(type, 60);
      }
    };
    timerRef.current = setTimeout(type, 800);
    return () => clearTimeout(timerRef.current);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll('.reveal-hidden');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('reveal-visible')),
      { threshold: 0.1 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const featured = products.slice(0, 8);

  return (
    <div className={`${styles.page} page-enter`}>
      <div className="noise-overlay" />

      {/* Background Orbs */}
      <div className="orb" style={{ width: 500, height: 500, background: 'rgba(55,48,163,0.2)', top: '-80px', left: '-80px' }} />
      <div className="orb" style={{ width: 400, height: 400, background: 'rgba(192,193,255,0.1)', bottom: 0, right: '-80px', animationDelay: '-5s' }} />

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Shop Smarter with AI <br />
            That <span className={styles.heroAccent}>Knows You</span>
          </h1>

          {/* Glowing Search Bar */}
          <div className={styles.searchWrapper}>
            <div className={styles.searchGlow} />
            <div className={`${styles.searchBar} glass`}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>search</span>
              <input
                className={styles.searchInput}
                placeholder={placeholder}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
              <span className="material-symbols-outlined" style={{ color: 'var(--color-on-surface-variant)', cursor: 'pointer' }}>mic</span>
            </div>
          </div>

          {/* Trending Tags */}
          <div className={`${styles.trending} no-scrollbar`}>
            <span className={styles.trendingLabel}>TRENDING:</span>
            {['Oversized Knits', 'Techwear', 'Eco-Luxe', 'Y2K Revival'].map((tag) => (
              <Link key={tag} to="/shop" className={`${styles.trendingTag} glass glow-primary`}>{tag}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof Ticker ── */}
      <div className={styles.ticker}>
        <div className="ticker-track">
          {['Featured in Vogue', 'TechCrunch Favorite', '1M+ Personalized Picks', 'Next-Gen Commerce', 'AI Fashion Awards 2024',
            'Featured in Vogue', 'TechCrunch Favorite', '1M+ Personalized Picks', 'Next-Gen Commerce', 'AI Fashion Awards 2024'].map((item, i) => (
            <span key={i} className={styles.tickerItem}>{item}</span>
          ))}
        </div>
      </div>

      {/* ── AI Curated Grid ── */}
      <section className={`${styles.gridSection} reveal-hidden`}>
        <div className={styles.gridHeader}>
          <div>
            <h2 className={styles.sectionTitle}>AI-Curated For You</h2>
            <p className={styles.sectionSub}>Based on your recent browsing and style DNA.</p>
          </div>
          <Link to="/shop" className={styles.viewAll}>View All Recommendations</Link>
        </div>

        <div className={styles.productGrid}>
          {featured.map((product, i) => (
            <div key={product.id} className="reveal-hidden" style={{ transitionDelay: `${i * 0.08}s` }}>
              <ProductCard
                product={product}
                badge={product.tags[0]}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── How AI Works ── */}
      <section className={`${styles.aiSection} reveal-hidden`}>
        <div className={styles.aiInner}>
          <div className={styles.aiHeader}>
            <span className={styles.aiLabel}>THE TECHNOLOGY</span>
            <h2 className={styles.aiTitle}>Intelligence in Every Click</h2>
          </div>

          <div className={styles.aiCards}>
            <div className={`${styles.aiCard} glass glow-primary`}>
              <div className={styles.aiCardIcon} style={{ background: 'rgba(192,193,255,0.1)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>psychology</span>
              </div>
              <h3 className={styles.aiCardTitle}>1. Style Analysis</h3>
              <p className={styles.aiCardText}>Our AI decodes your browsing patterns, color preferences, and silhouette choices to build a unique Style DNA profile.</p>
            </div>

            <div className={`${styles.aiCard} ${styles.aiCardOffset} glass glow-primary`}>
              <div className={styles.aiCardIcon} style={{ background: 'rgba(78,222,163,0.1)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-tertiary)' }}>hub</span>
              </div>
              <h3 className={styles.aiCardTitle}>2. Global Sourcing</h3>
              <p className={styles.aiCardText}>We scan 500+ premium brands and boutiques in real-time, matching your profile against millions of active listings.</p>
            </div>

            <div className={`${styles.aiCard} glass glow-primary`}>
              <div className={styles.aiCardIcon} style={{ background: 'rgba(255,178,183,0.1)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)' }}>verified</span>
              </div>
              <h3 className={styles.aiCardTitle}>3. Curated Precision</h3>
              <p className={styles.aiCardText}>Only the perfect matches reach your feed, with AI-driven size advice and style combinations generated just for you.</p>
            </div>
          </div>
        </div>

        {/* Decorative SVG line */}
        <svg className={styles.decorLine} viewBox="0 0 1440 400" preserveAspectRatio="none">
          <path d="M0 200 C360 400 720 0 1080 200 S1440 400 1440 400" fill="none" stroke="url(#line-grad)" strokeWidth="2" />
          <defs>
            <linearGradient id="line-grad" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#c0c1ff' }} />
              <stop offset="100%" style={{ stopColor: '#ffb2b7' }} />
            </linearGradient>
          </defs>
        </svg>
      </section>

      {/* ── AI Stylist FAB ── */}
      <button className={`${styles.fab} glass pulse-animate`}>
        <div className={styles.fabInner}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          <span className={styles.fabLabel}>AI Stylist</span>
        </div>
      </button>
    </div>
  );
}
