import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { searchProducts } from '../../context/SearchContext';
import { useCart } from '../../context/CartContext';
import styles from './SearchBar.module.css';

const RECENT_KEY = 'shopmind_recent_searches';
const MAX_RECENT = 5;

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
}
function saveRecent(query) {
  const prev = getRecent().filter(q => q !== query);
  localStorage.setItem(RECENT_KEY, JSON.stringify([query, ...prev].slice(0, MAX_RECENT)));
}
function removeRecent(query) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(getRecent().filter(q => q !== query)));
}

// ── Category badge color ──────────────────────────────────────────────────────
const CAT_COLORS = {
  Footwear:    { bg: 'rgba(192,193,255,0.15)', color: '#c0c1ff' },
  Outerwear:   { bg: 'rgba(78,222,163,0.15)',  color: '#4edea3' },
  Accessories: { bg: 'rgba(255,178,183,0.15)', color: '#ffb2b7' },
  Apparel:     { bg: 'rgba(128,131,255,0.15)', color: '#8083ff' },
  Electronics: { bg: 'rgba(255,214,100,0.15)', color: '#ffd664' },
};

export default function SearchBar({ variant = 'navbar', placeholder = 'Search products, brands, categories...' }) {
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState([]);
  const [open, setOpen]           = useState(false);
  const [focused, setFocused]     = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recent, setRecent]       = useState(getRecent);
  const inputRef  = useRef(null);
  const wrapRef   = useRef(null);
  const navigate  = useNavigate();
  const { addToCart } = useCart();

  // ── Live search as user types ─────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setActiveIdx(-1);
      return;
    }
    const found = searchProducts(query);
    setResults(found);
    setActiveIdx(-1);
  }, [query]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    const items = results.length > 0 ? results : [];
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && items[activeIdx]) {
        handleSelectProduct(items[activeIdx]);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  // ── Submit search → go to /shop?q=... ────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!query.trim()) return;
    saveRecent(query.trim());
    setRecent(getRecent());
    setOpen(false);
    navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
    inputRef.current?.blur();
  }, [query, navigate]);

  // ── Select a product from dropdown ───────────────────────────────────────
  const handleSelectProduct = useCallback((product) => {
    saveRecent(product.name);
    setRecent(getRecent());
    setQuery('');
    setOpen(false);
    navigate(`/product/${product.id}`);
  }, [navigate]);

  // ── Click recent search ───────────────────────────────────────────────────
  const handleRecentClick = useCallback((q) => {
    setQuery(q);
    const found = searchProducts(q);
    setResults(found);
    if (found.length === 1) {
      handleSelectProduct(found[0]);
    } else {
      saveRecent(q);
      navigate(`/shop?q=${encodeURIComponent(q)}`);
      setOpen(false);
    }
  }, [navigate, handleSelectProduct]);

  const handleDeleteRecent = (e, q) => {
    e.stopPropagation();
    removeRecent(q);
    setRecent(getRecent());
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, product.sizes?.[0] || 'One Size');
  };

  const showDropdown = open && focused;
  const showResults  = query.trim().length > 0;
  const noResults    = showResults && results.length === 0;

  return (
    <div
      ref={wrapRef}
      className={`${styles.wrap} ${styles[variant]} ${focused ? styles.wrapFocused : ''}`}
    >
      {/* ── Input ── */}
      <div className={styles.inputRow}>
        <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
        <input
          ref={inputRef}
          className={styles.input}
          placeholder={placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck="false"
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        {query && (
          <button
            className={styles.clearBtn}
            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
            aria-label="Clear search"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        )}
        {query.trim() && (
          <button className={styles.searchBtn} onClick={handleSubmit} aria-label="Search">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
          </button>
        )}
      </div>

      {/* ── Dropdown ── */}
      {showDropdown && (
        <div className={styles.dropdown}>

          {/* ── No query: show recent searches ── */}
          {!showResults && recent.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>Recent Searches</span>
                <button
                  className={styles.clearAllBtn}
                  onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]); }}
                >
                  Clear all
                </button>
              </div>
              {recent.map(q => (
                <div key={q} className={styles.recentItem} onClick={() => handleRecentClick(q)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-on-surface-variant)' }}>history</span>
                  <span className={styles.recentText}>{q}</span>
                  <button
                    className={styles.recentDelete}
                    onClick={e => handleDeleteRecent(e, q)}
                    aria-label={`Remove ${q}`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── No query, no recent: show trending ── */}
          {!showResults && recent.length === 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>Trending</span>
              </div>
              {['Sneakers', 'Outerwear', 'Watches', 'Headphones', 'Bags'].map(t => (
                <div key={t} className={styles.recentItem} onClick={() => handleRecentClick(t)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-tertiary)' }}>trending_up</span>
                  <span className={styles.recentText}>{t}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Results ── */}
          {showResults && !noResults && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</span>
                {results.length > 4 && (
                  <button className={styles.viewAllBtn} onClick={handleSubmit}>
                    View all
                  </button>
                )}
              </div>
              {results.slice(0, 6).map((product, i) => {
                const catStyle = CAT_COLORS[product.category] || CAT_COLORS.Apparel;
                return (
                  <div
                    key={product.id}
                    className={`${styles.resultItem} ${activeIdx === i ? styles.resultItemActive : ''}`}
                    onClick={() => handleSelectProduct(product)}
                    onMouseEnter={() => setActiveIdx(i)}
                  >
                    <div className={styles.resultImg}>
                      <img src={product.image} alt={product.name} loading="lazy" />
                    </div>
                    <div className={styles.resultInfo}>
                      <p className={styles.resultName}>
                        {highlightMatch(product.name, query)}
                      </p>
                      <div className={styles.resultMeta}>
                        <span
                          className={styles.resultCat}
                          style={{ background: catStyle.bg, color: catStyle.color }}
                        >
                          {product.category}
                        </span>
                        <span className={styles.resultBrand}>{product.brand}</span>
                        {product.rating && (
                          <span className={styles.resultRating}>
                            ⭐ {product.rating}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.resultRight}>
                      <span className={styles.resultPrice}>${product.price}</span>
                      {product.discount > 0 && (
                        <span className={styles.resultDiscount}>-{product.discount}%</span>
                      )}
                      <button
                        className={styles.resultAddBtn}
                        onClick={e => handleAddToCart(e, product)}
                        title="Add to cart"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_shopping_cart</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* See all results row */}
              {results.length > 0 && (
                <div className={styles.seeAll} onClick={handleSubmit}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>search</span>
                  See all {results.length} results for <strong>"{query}"</strong>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', marginLeft: 'auto' }}>arrow_forward</span>
                </div>
              )}
            </div>
          )}

          {/* ── Not found ── */}
          {noResults && (
            <div className={styles.notFound}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--color-on-surface-variant)', opacity: 0.4 }}>search_off</span>
              <p className={styles.notFoundTitle}>No results for <strong>"{query}"</strong></p>
              <p className={styles.notFoundSub}>Try a different keyword, category, or brand name</p>
              <div className={styles.notFoundSuggestions}>
                <span className={styles.notFoundSugLabel}>Try:</span>
                {['Sneakers', 'Jacket', 'Watch', 'Headphones'].map(s => (
                  <button key={s} className={styles.notFoundChip} onClick={() => { setQuery(s); }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Highlight matching text ───────────────────────────────────────────────────
function highlightMatch(text, query) {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} style={{ background: 'rgba(192,193,255,0.25)', color: 'var(--color-primary)', borderRadius: '2px', padding: '0 1px' }}>{part}</mark>
      : part
  );
}
