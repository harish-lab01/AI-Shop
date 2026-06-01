import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

let _genAI = null;
let _model = null;

function getModel() {
  if (!API_KEY) return null;
  if (!_genAI) _genAI = new GoogleGenerativeAI(API_KEY);
  if (!_model) {
    _model = _genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 1200,
        responseMimeType: 'application/json',
      },
    });
  }
  return _model;
}

// ── System prompt ─────────────────────────────────────────────────────────────
function buildSystemPrompt({ products, cartItems, wishlistItems, currentPage, cartTotal }) {
  const catalog = products.map(p =>
    `[ID:${p.id}] "${p.name}" | ${p.category} | $${p.price}${p.discount > 0 ? ` (was $${p.originalPrice}, ${p.discount}% OFF)` : ''} | Brand: ${p.brand} | Color: ${p.color} | Rating: ${p.rating}⭐ (${p.reviewCount} reviews) | Sizes: ${p.sizes.join(', ')} | ${p.inStock ? 'In Stock' : 'Out of Stock'}`
  ).join('\n');

  const cartStr = cartItems.length === 0
    ? 'Empty'
    : cartItems.map(i => `"${i.name}" ×${i.quantity}`).join(', ') + ` | Total: $${cartTotal.toFixed(2)}`;

  const wishStr = wishlistItems.length === 0 ? 'Empty'
    : wishlistItems.map(i => `"${i.name}"`).join(', ');

  return `You are ShopMind AI — a smart, warm personal shopping assistant. You can take REAL actions in the store.

LIVE STATE:
- Page: ${currentPage}
- Cart: ${cartStr}
- Wishlist: ${wishStr}

PRODUCT CATALOG:
${catalog}

RESPONSE FORMAT — always return valid JSON:
{
  "message": "conversational reply with **bold** and *italic* markdown",
  "action": null | { "type": "ADD_TO_CART"|"ADD_TO_WISHLIST"|"NAVIGATE"|"REMOVE_FROM_CART", "payload": { "productId": <number>, "size": "<string>", "path": "<string>", "label": "<string>" } },
  "products": [{ "id": <number> }]
}

CRITICAL RULES:
1. When user says "add X to cart" or "add X" or "I want X" → ALWAYS set action.type = "ADD_TO_CART" with the correct productId from the catalog. NEVER say cart is empty when user wants to ADD something.
2. When user says "show my cart" or "what's in my cart" → describe cart contents, set action.type = "NAVIGATE" path="/cart"
3. productId must be the exact numeric ID from the catalog (e.g. 3 for Titanium Linear Watch)
4. size must be the first available size from the product's sizes list
5. Always include matching products in the "products" array
6. Be concise, warm, like a luxury stylist`;
}

// ── Main send ─────────────────────────────────────────────────────────────────
export async function sendToGemini({ userMessage, history, storeContext }) {
  const model = getModel();
  if (!model) return localFallback(userMessage, storeContext);

  const systemPrompt = buildSystemPrompt(storeContext);

  const chatHistory = history
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .slice(-12)
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.role === 'user' ? m.content : (m.rawContent || m.content) }],
    }));

  try {
    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: { parts: [{ text: systemPrompt }] },
    });

    const result = await chat.sendMessage(userMessage);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }

    if (!parsed) return localFallback(userMessage, storeContext);

    // Normalize action — accept both "productId" and "id" from Gemini
    if (parsed.action?.payload) {
      const pl = parsed.action.payload;
      if (pl.id && !pl.productId) pl.productId = pl.id;
    }

    // Resolve products
    const resolvedProducts = (parsed.products || [])
      .map(p => {
        const id = typeof p === 'number' ? p : (p?.id ?? p?.productId);
        return id ? storeContext.products.find(prod => prod.id === Number(id)) : null;
      })
      .filter(Boolean);

    return {
      message: parsed.message || '',
      action: parsed.action || null,
      products: resolvedProducts,
    };
  } catch (err) {
    console.error('[ShopMind AI] Gemini error:', err?.message || err);
    return localFallback(userMessage, storeContext);
  }
}

// ── Scoring helpers ───────────────────────────────────────────────────────────
function scoreProduct(product, query) {
  const q = query.toLowerCase();
  let s = 0;
  if (product.name.toLowerCase().includes(q)) s += 10;
  if (product.category.toLowerCase().includes(q)) s += 8;
  if (product.brand.toLowerCase().includes(q)) s += 7;
  if (product.color.toLowerCase().includes(q)) s += 5;
  if (product.description.toLowerCase().includes(q)) s += 3;
  if (product.tags.some(t => t.toLowerCase().includes(q))) s += 4;
  return s;
}

function fuzzyFind(products, query) {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  return products
    .map(p => ({ p, s: words.reduce((acc, w) => acc + scoreProduct(p, w), 0) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map(x => x.p);
}

// ── Smart local fallback ──────────────────────────────────────────────────────
// IMPORTANT: Check ADD_TO_CART intent FIRST before any cart-view checks
export function localFallback(userMessage, { products, cartItems, wishlistItems, cartTotal }) {
  const msg = userMessage.toLowerCase().trim();

  // ── 1. ADD TO CART — must be checked FIRST before cart-view ──────────────
  const addCartRx = /(?:add|put|throw|get|buy|order|want|i want|i'll take|give me)\s+(?:the\s+|a\s+|an\s+)?(.+?)\s+(?:to|in(?:to)?)\s+(?:my\s+)?(?:cart|bag|basket)/i;
  const addCartM = msg.match(addCartRx);
  if (addCartM) {
    const query = addCartM[1].trim();
    const found = fuzzyFind(products, query);
    if (found.length > 0) {
      const p = found[0];
      return {
        message: `✅ Added **${p.name}** to your cart!\n\n**$${p.price}** · Size: ${p.sizes[0]}\n\nWant to keep shopping or go to checkout?`,
        action: { type: 'ADD_TO_CART', payload: { productId: p.id, size: p.sizes[0] } },
        products: [p],
      };
    }
    return {
      message: `I couldn't find "${query}" in our catalog. Here are some popular picks:`,
      action: null,
      products: [...products].sort((a, b) => b.rating - a.rating).slice(0, 3),
    };
  }

  // ── 2. ADD TO WISHLIST — also before cart-view ────────────────────────────
  const wishRx = /(?:save|wishlist|add|like|love|want)\s+(?:the\s+|a\s+)?(.+?)\s+(?:to\s+(?:my\s+)?wishlist|for\s+later)/i;
  const wishM = msg.match(wishRx);
  if (wishM) {
    const query = wishM[1].trim();
    const found = fuzzyFind(products, query);
    if (found.length > 0) {
      const p = found[0];
      return {
        message: `❤️ Saved **${p.name}** to your wishlist!`,
        action: { type: 'ADD_TO_WISHLIST', payload: { productId: p.id } },
        products: [p],
      };
    }
  }

  // ── 3. VIEW CART ──────────────────────────────────────────────────────────
  if (/\b(cart|bag|basket)\b/.test(msg) && /\b(what|show|see|view|check|my|in|is)\b/.test(msg)) {
    if (cartItems.length === 0) {
      return {
        message: "Your cart is **empty** right now. 🛍️\n\nWant me to recommend something?",
        action: null,
        products: [...products].sort((a, b) => b.rating - a.rating).slice(0, 3),
      };
    }
    const lines = cartItems.map(i => `• **${i.name}** (${i.size}) ×${i.quantity} — $${(i.price * i.quantity).toFixed(2)}`).join('\n');
    return {
      message: `Here's your cart:\n\n${lines}\n\n**Total: $${cartTotal.toFixed(2)}**`,
      action: { type: 'NAVIGATE', payload: { path: '/cart', label: 'View Cart' } },
      products: [],
    };
  }

  // ── 4. VIEW WISHLIST ──────────────────────────────────────────────────────
  if (/\b(wishlist|saved|favorites|favourite)\b/.test(msg) && /\b(what|show|see|view|check|my|in)\b/.test(msg)) {
    if (wishlistItems.length === 0) {
      return {
        message: "Your wishlist is **empty**. ❤️\n\nBrowse the shop and save items you love!",
        action: { type: 'NAVIGATE', payload: { path: '/shop', label: 'Browse Shop' } },
        products: [],
      };
    }
    const lines = wishlistItems.map(i => `• **${i.name}** — $${i.price}`).join('\n');
    return {
      message: `Your wishlist (${wishlistItems.length} items):\n\n${lines}`,
      action: { type: 'NAVIGATE', payload: { path: '/wishlist', label: 'View Wishlist' } },
      products: wishlistItems.slice(0, 4),
    };
  }

  // ── 5. CHECKOUT ───────────────────────────────────────────────────────────
  if (/\b(checkout|check out|pay|purchase|buy now|complete order|place order)\b/.test(msg)) {
    if (cartItems.length === 0) {
      return {
        message: "Your cart is empty! Add some items first. 🛒",
        action: null,
        products: [...products].sort((a, b) => b.rating - a.rating).slice(0, 3),
      };
    }
    return {
      message: `Let's go! 🎉 You have **${cartItems.length} item(s)** totaling **$${cartTotal.toFixed(2)}**.`,
      action: { type: 'NAVIGATE', payload: { path: '/checkout', label: 'Go to Checkout' } },
      products: [],
    };
  }

  // ── 6. NAVIGATE ───────────────────────────────────────────────────────────
  if (/\b(go to|take me to|open|show me)\s+(the\s+)?(shop|store|collection|catalog)\b/.test(msg))
    return { message: "Taking you to the collection! 🛍️", action: { type: 'NAVIGATE', payload: { path: '/shop', label: 'Browse Shop' } }, products: [] };
  if (/\b(go to|take me to|open|show me)\s+(the\s+)?(dashboard|account|profile)\b/.test(msg))
    return { message: "Opening your dashboard! 👤", action: { type: 'NAVIGATE', payload: { path: '/dashboard', label: 'My Dashboard' } }, products: [] };
  if (/\b(go to|take me to|open|show me)\s+(the\s+)?(cart|bag)\b/.test(msg))
    return { message: "Opening your cart! 🛒", action: { type: 'NAVIGATE', payload: { path: '/cart', label: 'View Cart' } }, products: [] };

  // ── 7. PRICE RANGE ────────────────────────────────────────────────────────
  const betweenM = msg.match(/between\s+\$?(\d+)\s+and\s+\$?(\d+)/i);
  if (betweenM) {
    const [, lo, hi] = betweenM;
    const found = products.filter(p => p.price >= +lo && p.price <= +hi).slice(0, 4);
    return { message: found.length > 0 ? `Items between **$${lo}–$${hi}**:` : `Nothing in that range. Try wider?`, action: null, products: found };
  }
  const underM = msg.match(/under\s+\$?(\d+)/i);
  if (underM) {
    const max = +underM[1];
    const found = products.filter(p => p.price < max).sort((a, b) => b.rating - a.rating).slice(0, 4);
    return { message: `Best picks **under $${max}**:`, action: null, products: found.length > 0 ? found : [...products].sort((a, b) => a.price - b.price).slice(0, 4) };
  }

  // ── 8. SALE ───────────────────────────────────────────────────────────────
  if (/\b(sale|discount|deal|offer|promo|cheap|affordable)\b/.test(msg)) {
    const found = products.filter(p => p.discount > 0).sort((a, b) => b.discount - a.discount);
    return { message: `🔥 **${found.length} items on sale** — up to **${Math.max(...found.map(p => p.discount))}% off**:`, action: null, products: found.slice(0, 4) };
  }

  // ── 9. TOP RATED ──────────────────────────────────────────────────────────
  if (/\b(best|top rated|highest rated|popular|trending|top picks|recommend)\b/.test(msg)) {
    return { message: `⭐ Our **highest-rated** products:`, action: null, products: [...products].sort((a, b) => b.rating - a.rating).slice(0, 4) };
  }

  // ── 10. CATEGORY ─────────────────────────────────────────────────────────
  const catMap = {
    'footwear|shoes|sneakers|boots|trainers|loafers': 'Footwear',
    'outerwear|jacket|coat|shell|parka': 'Outerwear',
    'accessories|watch|bag|handbag|sunglasses|optics': 'Accessories',
    'apparel|clothing|clothes|shirt|tee|dress|gown|knit': 'Apparel',
    'electronics|headphones|audio|earphones': 'Electronics',
  };
  for (const [pattern, category] of Object.entries(catMap)) {
    if (new RegExp(`\\b(${pattern})\\b`).test(msg)) {
      const found = products.filter(p => p.category === category).slice(0, 4);
      if (found.length > 0) return { message: `Our **${category}** picks:`, action: null, products: found };
    }
  }

  // ── 11. OCCASION ─────────────────────────────────────────────────────────
  if (/\b(night out|party|evening|formal|gala|dinner)\b/.test(msg)) {
    return { message: `For a **night out**, these elevated pieces are perfect:`, action: null, products: products.filter(p => ['Apparel', 'Accessories'].includes(p.category)).sort((a, b) => b.price - a.price).slice(0, 4) };
  }
  if (/\b(casual|everyday|daily|weekend)\b/.test(msg)) {
    return { message: `For a **casual** look:`, action: null, products: products.filter(p => p.price < 300).sort((a, b) => b.rating - a.rating).slice(0, 4) };
  }
  if (/\b(gift|present|someone|friend|partner)\b/.test(msg)) {
    return { message: `🎁 Great gift ideas:`, action: null, products: [...products].sort((a, b) => b.rating - a.rating).slice(0, 4) };
  }

  // ── 12. GREETING ─────────────────────────────────────────────────────────
  if (/^(hi|hello|hey|sup|yo|howdy|good\s*(morning|evening|afternoon))/.test(msg)) {
    return {
      message: "Hey! 👋 I'm **ShopMind AI**.\n\nI can add items to your cart, find deals, recommend outfits, and more. What are you looking for?",
      action: null,
      products: [...products].sort((a, b) => b.rating - a.rating).slice(0, 4),
    };
  }

  // ── 13. FUZZY PRODUCT MATCH ───────────────────────────────────────────────
  const fuzzy = fuzzyFind(products, msg);
  if (fuzzy.length > 0 && scoreProduct(fuzzy[0], msg) >= 5) {
    const p = fuzzy[0];
    return {
      message: `I found **${p.name}** — $${p.price}, rated ${p.rating}⭐.\n\nWant me to **add it to your cart**?`,
      action: null,
      products: fuzzy.slice(0, 3),
    };
  }

  // ── 14. HELP ──────────────────────────────────────────────────────────────
  if (/\b(shipping|delivery)\b/.test(msg))
    return { message: "**Free shipping** on orders over $500 (3–5 days). Express next-day delivery for $25. 🌿 Carbon-neutral.", action: null, products: [] };
  if (/\b(return|refund|exchange)\b/.test(msg))
    return { message: "**30-day returns** — unworn items with tags. Refunds in 5–7 business days.", action: null, products: [] };
  if (/\b(size|sizing|fit)\b/.test(msg))
    return { message: "**Apparel/Outerwear:** XS–XXL\n**Footwear:** US 7–12\n**Accessories:** One Size", action: null, products: [] };

  // ── 15. DEFAULT ───────────────────────────────────────────────────────────
  return {
    message: "I can help you shop smarter! Try:\n\n• *\"Add the watch to my cart\"*\n• *\"Show me jackets under $500\"*\n• *\"What's on sale?\"*\n• *\"Recommend something for a night out\"*",
    action: null,
    products: [...products].sort((a, b) => b.rating - a.rating).slice(0, 3),
  };
}
