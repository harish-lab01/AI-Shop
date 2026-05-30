import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/ProductCard/ProductCard';
import { products } from '../../data/products';
import styles from './HomeAnimated.module.css';

const HERO_TEXT = "Shop Smarter with AI That Knows You";
const PLACEHOLDERS = [
  "Try: red dress for a summer wedding...",
  "Find me a minimalist winter coat...",
  "Show me sustainable techwear brands.",
  "What should I wear to a Tokyo art gala?",
  "Find me sneakers that match indigo denim.",
];

export default function HomeAnimated() {
  const [words, setWords] = useState([]);
  const [subVisible, setSubVisible] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const pIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const isDeletingRef = useRef(false);
  const timerRef = useRef(null);

  // Word-by-word hero reveal
  useEffect(() => {
    const wordList = HERO_TEXT.split(' ');
    setWords(wordList);
    setTimeout(() => setSubVisible(true), 100);
  }, []);

  // Typewriter
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
    timerRef.current = setTimeout(type, 1200);
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

  // Parallax orbs on mouse move
  useEffect(() => {
    const handleMouse = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 40;
      const y = (e.clientY / window.innerHeight - 0.5) * 40;
      document.querySelectorAll('.orb').forEach((orb, i) => {
        const factor = (i + 1) * 0.5;
        orb.style.marginTop = `${y * factor}px`;
        orb.style.marginLeft = `${x * factor}px`;
      });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  const accentWords = ['Knows', 'You'];
  const featured = products.slice(0, 4);

  return (
    <div className={`${styles.page} page-enter`}>
      <div className="noise-overlay" />

      {/* Orbs */}
      <div className="orb" style={{ width: 600, height: 600, background: 'rgba(192,193,255,0.3)', top: '-10%', left: '-10%', animationDuration: '22s' }} />
      <div className="orb" style={{ width: 500, height: 500, background: 'rgba(255,178,183,0.2)', bottom: '-5%', right: '-5%', animationDuration: '28s', animationDelay: '-5s' }} />
      <div className="orb" style={{ width: 450, height: 450, background: 'rgba(78,222,163,0.2)', top: '40%', right: '10%', animationDuration: '25s', animationDelay: '-12s' }} />

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            {words.map((word, i) => (
              <span
                key={i}
                className={`word-reveal-span ${accentWords.includes(word) ? styles.accent : ''}`}
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                {word}&nbsp;
              </span>
            ))}
          </h1>

          <p
            className={styles.heroSub}
            style={{
              opacity: subVisible ? 1 : 0,
              transform: subVisible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 1s ease 0.5s, transform 1s ease 0.5s',
            }}
          >
            Experience a hyper-personalized shopping journey driven by advanced neural intelligence.
          </p>

          {/* Search */}
          <div className={`${styles.searchWrapper} focus-glow`}>
            <div className={styles.searchGlow} />
            <div className={`${styles.searchBar} glass`}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>search</span>
              <input className={styles.searchInput} placeholder={placeholder} readOnly />
              <span className="material-symbols-outlined" style={{ color: 'var(--color-on-surface-variant)', cursor: 'pointer' }}>mic</span>
            </div>
          </div>

          {/* Trending */}
          <div className={`${styles.trending} no-scrollbar`}>
            <span className={styles.trendingLabel}>TRENDING:</span>
            {['Oversized Knits', 'Techwear', 'Eco-Luxe', 'Y2K Revival'].map((tag) => (
              <Link key={tag} to="/shop" className={`${styles.trendingTag} glass glow-primary`}>{tag}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className={styles.ticker}>
        <div className="ticker-track">
          {['Featured in Vogue', 'TechCrunch Favorite', '1M+ Personalized Picks', 'Next-Gen Commerce', 'AI Fashion Awards 2024',
            'Featured in Vogue', 'TechCrunch Favorite', '1M+ Personalized Picks', 'Next-Gen Commerce', 'AI Fashion Awards 2024'].map((item, i) => (
            <span key={i} className={styles.tickerItem}>{item}</span>
          ))}
        </div>
      </div>

      {/* ── Product Grid ── */}
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
            <div key={product.id} className="reveal-hidden product-card" style={{ transitionDelay: `${i * 0.1}s` }}>
              <ProductCard product={product} badge={product.tags[0]} />
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
            {[
              { icon: 'psychology', color: 'var(--color-primary)', bg: 'rgba(192,193,255,0.1)', title: '1. Style Analysis', text: 'Our AI decodes your browsing patterns, color preferences, and silhouette choices to build a unique Style DNA profile.' },
              { icon: 'hub', color: 'var(--color-tertiary)', bg: 'rgba(78,222,163,0.1)', title: '2. Global Sourcing', text: 'We scan 500+ premium brands and boutiques in real-time, matching your profile against millions of active listings.', offset: true },
              { icon: 'verified', color: 'var(--color-secondary)', bg: 'rgba(255,178,183,0.1)', title: '3. Curated Precision', text: 'Only the perfect matches reach your feed, with AI-driven size advice and style combinations generated just for you.' },
            ].map((card) => (
              <div key={card.title} className={`${styles.aiCard} ${card.offset ? styles.aiCardOffset : ''} glass glow-primary`}>
                <div className={styles.aiCardIcon} style={{ background: card.bg }}>
                  <span className="material-symbols-outlined" style={{ color: card.color }}>{card.icon}</span>
                </div>
                <h3 className={styles.aiCardTitle}>{card.title}</h3>
                <p className={styles.aiCardText}>{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Stylist FAB ── */}
      <button className={`${styles.fab} glass pulse-animate`} onClick={() => setPanelOpen(true)}>
        <div className={styles.fabInner}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          <span className={styles.fabLabel}>AI Stylist</span>
        </div>
      </button>

      {/* ── AI Stylist Side Panel ── */}
      <div className={`${styles.sidePanel} side-panel glass ${panelOpen ? 'open' : ''}`}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>AI Personal Stylist</h2>
          <button className={styles.panelClose} onClick={() => setPanelOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className={styles.panelBody}>
          <div className={styles.panelSuggestion}>
            <p className={styles.panelSuggestionLabel}>AI Suggestion</p>
            <p className={styles.panelSuggestionText}>"I see you like deep indigo. Based on your profile, the Sonic Air Max in Matte Onyx would pair perfectly with raw denim."</p>
          </div>
          <div className={styles.panelPrompts}>
            <p className={styles.panelPromptsLabel}>TRY ASKING ME:</p>
            <ul className={styles.panelPromptList}>
              <li>What matches my trench coat?</li>
              <li>Suggest a gift for an architect.</li>
              <li>Find sustainable luxury brands.</li>
            </ul>
          </div>
        </div>
        <div className={styles.panelInput}>
          <div className={`${styles.panelInputBar} glass`}>
            <input className={styles.panelInputField} placeholder="Message stylist..." />
            <button className={styles.panelSendBtn}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
