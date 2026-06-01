import { createContext, useContext, useState, useCallback } from 'react';
import { products } from '../data/products';

const SearchContext = createContext(null);

// ── Synonym / keyword map ─────────────────────────────────────────────────────
// Maps common search words → categories or product keywords
const SYNONYMS = {
  shoe: 'Footwear', shoes: 'Footwear', sneaker: 'Footwear', sneakers: 'Footwear',
  boot: 'Footwear', boots: 'Footwear', trainer: 'Footwear', trainers: 'Footwear',
  loafer: 'Footwear', loafers: 'Footwear', footwear: 'Footwear', kicks: 'Footwear',
  jacket: 'Outerwear', coat: 'Outerwear', outerwear: 'Outerwear', parka: 'Outerwear',
  shell: 'Outerwear', trench: 'Outerwear', blazer: 'Outerwear',
  watch: 'Accessories', bag: 'Accessories', handbag: 'Accessories',
  sunglasses: 'Accessories', glasses: 'Accessories', accessory: 'Accessories',
  accessories: 'Accessories', jewellery: 'Accessories', jewelry: 'Accessories',
  headphone: 'Electronics', headphones: 'Electronics', earphone: 'Electronics',
  earphones: 'Electronics', audio: 'Electronics', speaker: 'Electronics',
  tshirt: 'Apparel', shirt: 'Apparel', dress: 'Apparel', gown: 'Apparel',
  clothing: 'Apparel', clothes: 'Apparel', apparel: 'Apparel', tee: 'Apparel',
  knit: 'Apparel', sweater: 'Apparel', top: 'Apparel',
};

// ── Score a product against a query ──────────────────────────────────────────
function scoreProduct(product, query) {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  let score = 0;

  const name  = product.name.toLowerCase();
  const cat   = product.category.toLowerCase();
  const brand = product.brand.toLowerCase();
  const color = product.color.toLowerCase();
  const desc  = product.description.toLowerCase();
  const tags  = product.tags.map(t => t.toLowerCase()).join(' ');

  // Exact name match — highest priority
  if (name === q) score += 100;
  else if (name.startsWith(q)) score += 60;
  else if (name.includes(q)) score += 40;

  // Category match
  if (cat === q || cat.includes(q)) score += 35;

  // Synonym → category match
  const synCat = SYNONYMS[q];
  if (synCat && product.category === synCat) score += 50;

  // Brand match
  if (brand.includes(q)) score += 30;

  // Color match
  if (color.includes(q)) score += 20;

  // Tags match
  if (tags.includes(q)) score += 25;

  // Description match
  if (desc.includes(q)) score += 10;

  // Multi-word: score each word
  const words = q.split(/\s+/).filter(w => w.length > 1);
  if (words.length > 1) {
    words.forEach(w => {
      if (name.includes(w)) score += 15;
      if (cat.includes(w)) score += 12;
      if (brand.includes(w)) score += 10;
      if (desc.includes(w)) score += 5;
      const syn = SYNONYMS[w];
      if (syn && product.category === syn) score += 20;
    });
  }

  return score;
}

// ── Main search function ──────────────────────────────────────────────────────
export function searchProducts(query) {
  if (!query.trim()) return [];
  return products
    .map(p => ({ product: p, score: scoreProduct(p, query) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.product);
}

// ── Context Provider ──────────────────────────────────────────────────────────
export function SearchProvider({ children }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback((q) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setHasSearched(true);
    setResults(searchProducts(q));
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  }, []);

  return (
    <SearchContext.Provider value={{ query, results, hasSearched, search, clear }}>
      {children}
    </SearchContext.Provider>
  );
}

export const useSearch = () => {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
};
