import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/ProductCard/ProductCard';
import AIPill from '../../components/AIPill/AIPill';
import { products } from '../../data/products';
import styles from './FashionApparel.module.css';

const CATEGORIES = ['All', 'Apparel', 'Footwear', 'Outerwear', 'Accessories', 'Electronics'];
const SORT_OPTIONS = ['AI Recommendation', 'Price: Low to High', 'Price: High to Low', 'Newest First'];

export default function FashionApparel() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('AI Recommendation');
  const [priceRange, setPriceRange] = useState([0, 2400]);
  const [searchBrand, setSearchBrand] = useState('');

  const filtered = products
    .filter((p) => activeCategory === 'All' || p.category === activeCategory)
    .filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1])
    .sort((a, b) => {
      if (sortBy === 'Price: Low to High') return a.price - b.price;
      if (sortBy === 'Price: High to Low') return b.price - a.price;
      return 0;
    });

  return (
    <div className={`${styles.page} page-enter`}>
      <div className="noise-overlay" />

      {/* ── Category Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjWZjmIVh0hxVXCdq_wYTwcZH5wfFV0Wa5ziuJrhgqF0pRxGPTXFv57DEis9WjkAq86EOdCzMC6zzrJyTShZ5R87KC0lqMCyBzJFoapEckzKzZlatFhd_0law7jWtyVBshn2uvjJNVHsSYIlkLSjoQjEr0OCR92vFp3jvjITKQJXEHaWzwQNYzoFJJgEfNUhBWCAbrbMuaRaCWUspgAbotE7_bVd3o2CIyP4UK7B-uWWw1pYZLk2-A4jxt5GKfx7eeuP78VLJJlWI"
            alt="Fashion Curation"
            className={styles.heroBgImg}
          />
          <div className={styles.heroBgOverlay} />
        </div>
        <div className={styles.heroInner}>
          <nav className={styles.breadcrumb}>
            <Link to="/">Home</Link>
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>chevron_right</span>
            <span>Collections</span>
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>chevron_right</span>
            <span style={{ color: 'var(--color-primary)' }}>Fashion Curation</span>
          </nav>
          <h1 className={styles.heroTitle}>Fashion Curation</h1>
        </div>
      </section>

      {/* ── Main Content ── */}
      <section className={styles.main}>
        {/* ── Sidebar ── */}
        <aside className={`${styles.sidebar} glass`}>
          {/* Price Range */}
          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Price Range</h3>
            <div className={styles.priceSlider}>
              <input
                type="range"
                min={0}
                max={2400}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className={styles.rangeInput}
              />
            </div>
            <div className={styles.priceLabels}>
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>

          {/* Brand Search */}
          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Brand</h3>
            <div className={styles.brandSearch}>
              <input
                type="text"
                placeholder="Search brands..."
                value={searchBrand}
                onChange={(e) => setSearchBrand(e.target.value)}
                className={styles.brandInput}
              />
              <span className="material-symbols-outlined" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-on-surface-variant)', fontSize: '20px' }}>search</span>
            </div>
            <div className={styles.brandList}>
              {['Prada AI', 'Balenciaga Vision', 'Digital Dior', 'Neo-Kinetics', 'Nomad Studio'].map((brand) => (
                <label key={brand} className={styles.checkLabel}>
                  <input type="checkbox" className={styles.checkbox} />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Rating</h3>
            <button className={styles.ratingBtn}>
              {[1,2,3,4].map((s) => (
                <span key={s} className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-tertiary)', fontVariationSettings: "'FILL' 1" }}>star</span>
              ))}
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-on-surface-variant)' }}>star</span>
              <span className={styles.ratingLabel}>&amp; Up</span>
            </button>
          </div>

          <button className={styles.applyBtn}>Apply Filters</button>
        </aside>

        {/* ── Product Feed ── */}
        <div className={styles.feed}>
          {/* Top Bar */}
          <div className={`${styles.topBar} glass`}>
            <div className={styles.topBarLeft}>
              <span className={styles.productCount}>{filtered.length} products</span>
              <div className={styles.activeTags}>
                {activeCategory !== 'All' && (
                  <span className={styles.activeTag}>
                    {activeCategory}
                    <button onClick={() => setActiveCategory('All')} className={styles.tagClose}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                    </button>
                  </span>
                )}
              </div>
            </div>
            <div className={styles.topBarRight}>
              <span className={styles.sortLabel}>Sort by:</span>
              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Category Chips */}
          <div className={styles.categoryChips}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`${styles.chip} ${activeCategory === cat ? styles.chipActive : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className={styles.productGrid}>
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} badge={product.tags[0]} />
            ))}
            {filtered.length === 0 && (
              <div className={styles.empty}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-on-surface-variant)' }}>search_off</span>
                <p>No products match your filters.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <AIPill placeholder="Tell me what you're looking for..." />
    </div>
  );
}
