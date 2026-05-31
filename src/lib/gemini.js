import { GoogleGenerativeAI } from '@google/generative-ai';

// ─────────────────────────────────────────────────────────────────────────────
// Gemini client — uses gemini-2.0-flash (free tier: 15 RPM, 1M TPM)
// Get your free key at: https://aistudio.google.com/app/apikey
// ─────────────────────────────────────────────────────────────────────────────
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
        temperature: 0.75,
        topP: 0.95,
        maxOutputTokens: 1200,
        responseMimeType: 'application/json',   // force JSON output
      },
    });
  }
  return _model;
}

// ─────────────────────────────────────────────────────────────────────────────
// System prompt — injected fresh on every call with live store state
// ─────────────────────────────────────────────────────────────────────────────
function buildSystemPrompt({ products, cartItems, wishlistItems, currentPage, cartTotal }) {
  const catalog = products.map(p =>
    `[ID:${p.id}] "${p.name}" | ${p.category} | $${p.price}${p.discount > 0 ? ` (was $${p.originalPrice}, ${p.discount}% OFF)` : ''} | Brand: ${p.brand} | Color: ${p.color} | Rating: ${p.rating}⭐ (${p.reviewCount} reviews) | Sizes: ${p.sizes.join(', ')} | ${p.inStock ? '✅ In Stock' : '❌ Out of Stock'} | Tags: ${p.tags.join(', ')} | Desc: ${p.description}`
  ).join('\n');

  const cartStr = cartItems.length === 0
    ? 'Empty'
    : cartItems.map(i => `"${i.name}" size ${i.size} ×${i.quantity} = $${(i.price * i.quantity).toFixed(2)}`).join('; ') + ` | TOTAL: $${cartTotal.toFixed(2)}`;

  const wishStr = wishlistItems.length === 0
    ? 'Empty'
    : wishlistItems.map(i => `"${i.name}" $${i.price}`).join('; ');

  return `You are ShopMind AI — a brilliant, warm personal shopping assistant for a premium dark-luxury AI fashion marketplace. You have COMPLETE real-time access to the store and can execute real actions.

═══════════════════════════════════════
LIVE STORE STATE (updated every message)
═══════════════════════════════════════
Current Page: ${currentPage}
Cart: ${cartStr}
Wishlist: ${wishStr}

═══════════════════════════════════════
PRODUCT CATALOG (12 items)
═══════════════════════════════════════
${catalog}

═══════════════════════════════════════
YOUR CAPABILITIES
═══════════════════════════════════════
1. FIND & RECOMMEND — search by name, category, price range, occasion, style, brand, color
2. ADD TO CART — detect intent and execute ADD_TO_CART action with correct product ID
3. ADD TO WISHLIST — save items the user wants to keep for later
4. NAVIGATE — take user to any page: /shop, /cart, /checkout, /wishlist, /dashboard, /product/:id
5. CART MANAGEMENT — show cart contents, total, suggest checkout, remove items
6. STYLE ADVICE — outfit combinations, occasion-based picks, seasonal recommendations
7. COMPARE — side-by-side product comparisons with pros/cons
8. PRICE INTELLIGENCE — find deals, items under budget, best value picks
9. ANSWER QUESTIONS — sizing, shipping, returns, brand info, sustainability

═══════════════════════════════════════
STRICT RESPONSE FORMAT (JSON only)
═══════════════════════════════════════
{
  "message": "string — conversational reply, supports **bold**, *italic*, bullet points with •",
  "action": null | {
    "type": "ADD_TO_CART" | "ADD_TO_WISHLIST" | "NAVIGATE" | "REMOVE_FROM_CART",
    "payload": {
      "productId": number,        // for cart/wishlist actions
      "size": "string",           // for ADD_TO_CART (use first available size if not specified)
      "path": "string",           // for NAVIGATE e.g. "/cart", "/shop", "/product/3"
      "label": "string"           // for NAVIGATE button label
    }
  },
  "products": []                  // array of product IDs to show as cards: [{ "id": 1 }, { "id": 3 }]
}

═══════════════════════════════════════
BEHAVIOR RULES
═══════════════════════════════════════
• Always respond ONLY with valid JSON matching the format above — no extra text outside JSON
• When user asks to add something to cart: find best matching product, set action.type = "ADD_TO_CART", confirm in message
• When recommending products: always populate the "products" array with matching product IDs
• When navigating: set action.type = "NAVIGATE" with the correct path
• Never invent products — only use the catalog above
• Be concise (under 120 words) unless doing a detailed comparison
• Use exact prices, ratings, and sizes from the catalog
• If user asks about cart/wishlist, reference the live state above
• For ambiguous requests, ask a clarifying question
• Personality: warm, knowledgeable, like a luxury personal stylist at a high-end boutique`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main send function
// ─────────────────────────────────────────────────────────────────────────────
export async function sendToGemini({ userMessage, history, storeContext }) {
  const model = getModel();

  if (!model) {
    return localFallback(userMessage, storeContext);
  }

  const systemPrompt = buildSystemPrompt(storeContext);

  // Build multi-turn history (last 8 exchanges = 16 messages)
  const chatHistory = history
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .slice(-16)
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

    // Parse — responseMimeType forces JSON but strip markdown fences just in case
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: extract first JSON object
      const match = cleaned.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }

    if (!parsed) return localFallback(userMessage, storeContext);

    // Normalize products array — accept [{id:1}] or [1] or full objects
    const rawProds = parsed.products || [];
    const resolvedProducts = rawProds
      .map(p => {
        const id = typeof p === 'number' ? p : p?.id;
        return id ? storeContext.products.find(prod => prod.id === id) : null;
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

// ─────────────────────────────────────────────────────────────────────────────
// Smart local fallback — fully functional without API key
// ─────────────────────────────────────────────────────────────────────────────
function score(product, query) {
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
    .map(p => ({ p, s: words.reduce((acc, w) => acc + score(p, w), 0) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map(x => x.p);
}

export function localFallback(userMessage, { products, cartItems, wishlistItems, cartTotal }) {
  const msg = userMessage.toLowerCase().trim();

  // ── Greetings ──
  if (/^(hi|hello|hey|sup|yo|howdy|good\s*(morning|evening|afternoon))/.test(msg)) {
    return {
      message: "Hey! 👋 I'm **ShopMind AI** — your personal luxury stylist.\n\nI can find products, add items to your cart, check deals, compare items, and more. What are you looking for today?",
      action: null,
      products: [...products].sort((a, b) => b.rating - a.rating).slice(0, 4),
    };
  }

  // ── Cart: show contents ──
  if (/\b(cart|bag|basket)\b/.test(msg) && /\b(what|show|see|view|check|my|in)\b/.test(msg)) {
    if (cartItems.length === 0) {
      return {
        message: "Your cart is **empty** right now. 🛍️\n\nWant me to recommend something based on what's trending?",
        action: null,
        products: [...products].sort((a, b) => b.rating - a.rating).slice(0, 3),
      };
    }
    const lines = cartItems.map(i => `• **${i.name}** (${i.size}) ×${i.quantity} — $${(i.price * i.quantity).toFixed(2)}`).join('\n');
    return {
      message: `Here's your cart:\n\n${lines}\n\n**Total: $${cartTotal.toFixed(2)}**\n\nReady to checkout?`,
      action: { type: 'NAVIGATE', payload: { path: '/cart', label: 'View Cart' } },
      products: [],
    };
  }

  // ── Wishlist: show contents ──
  if (/\b(wishlist|saved|favorites|favourite)\b/.test(msg) && /\b(what|show|see|view|check|my|in)\b/.test(msg)) {
    if (wishlistItems.length === 0) {
      return {
        message: "Your wishlist is **empty**. ❤️\n\nBrowse the shop and tap the heart on any item to save it!",
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

  // ── Add to cart ──
  const addCartRx = /(?:add|put|throw|get)\s+(?:the\s+)?(.+?)\s+(?:to|in(?:to)?)\s+(?:my\s+)?(?:cart|bag|basket)/i;
  const addCartM = msg.match(addCartRx);
  if (addCartM) {
    const query = addCartM[1].trim();
    const found = fuzzyFind(products, query);
    if (found.length > 0) {
      const p = found[0];
      return {
        message: `Done! ✅ Added **${p.name}** (${p.sizes[0]}) to your cart for **$${p.price}**.\n\nWant to keep shopping or head to checkout?`,
        action: { type: 'ADD_TO_CART', payload: { productId: p.id, size: p.sizes[0] } },
        products: [p],
      };
    }
    return {
      message: `I couldn't find "${query}" in our catalog. Here are some popular picks instead:`,
      action: null,
      products: [...products].sort((a, b) => b.rating - a.rating).slice(0, 3),
    };
  }

  // ── Add to wishlist ──
  const wishRx = /(?:save|wishlist|add|like|love|want)\s+(?:the\s+)?(.+?)\s+(?:to\s+(?:my\s+)?wishlist|for\s+later)/i;
  const wishM = msg.match(wishRx);
  if (wishM) {
    const query = wishM[1].trim();
    const found = fuzzyFind(products, query);
    if (found.length > 0) {
      const p = found[0];
      return {
        message: `Saved! ❤️ **${p.name}** has been added to your wishlist.`,
        action: { type: 'ADD_TO_WISHLIST', payload: { productId: p.id } },
        products: [p],
      };
    }
  }

  // ── Checkout ──
  if (/\b(checkout|check out|pay|purchase|buy now|complete order|place order)\b/.test(msg)) {
    if (cartItems.length === 0) {
      return {
        message: "Your cart is empty! Add some items first and I'll take you straight to checkout. 🛒",
        action: null,
        products: [...products].sort((a, b) => b.rating - a.rating).slice(0, 3),
      };
    }
    return {
      message: `Let's complete your order! 🎉\n\nYou have **${cartItems.length} item(s)** totaling **$${cartTotal.toFixed(2)}**. Taking you to checkout now.`,
      action: { type: 'NAVIGATE', payload: { path: '/checkout', label: 'Go to Checkout' } },
      products: [],
    };
  }

  // ── Navigate to pages ──
  if (/\b(go to|take me to|open|show me)\s+(the\s+)?(shop|store|collection|catalog)\b/.test(msg)) {
    return { message: "Taking you to the full collection! 🛍️", action: { type: 'NAVIGATE', payload: { path: '/shop', label: 'Browse Shop' } }, products: [] };
  }
  if (/\b(go to|take me to|open|show me)\s+(the\s+)?(dashboard|account|profile)\b/.test(msg)) {
    return { message: "Opening your dashboard! 👤", action: { type: 'NAVIGATE', payload: { path: '/dashboard', label: 'My Dashboard' } }, products: [] };
  }
  if (/\b(go to|take me to|open|show me)\s+(the\s+)?(cart|bag)\b/.test(msg)) {
    return { message: "Opening your cart! 🛒", action: { type: 'NAVIGATE', payload: { path: '/cart', label: 'View Cart' } }, products: [] };
  }

  // ── Price range ──
  const underM = msg.match(/under\s+\$?(\d+)/i);
  const betweenM = msg.match(/between\s+\$?(\d+)\s+and\s+\$?(\d+)/i);
  if (betweenM) {
    const [, lo, hi] = betweenM;
    const found = products.filter(p => p.price >= +lo && p.price <= +hi).slice(0, 4);
    return {
      message: found.length > 0
        ? `Here are items between **$${lo}–$${hi}**:`
        : `No items found in that range. Try a wider budget?`,
      action: null,
      products: found,
    };
  }
  if (underM) {
    const max = +underM[1];
    const found = products.filter(p => p.price < max).sort((a, b) => b.rating - a.rating).slice(0, 4);
    return {
      message: found.length > 0
        ? `Here are our best picks **under $${max}**:`
        : `Nothing under $${max} right now. Here are our most affordable options:`,
      action: null,
      products: found.length > 0 ? found : [...products].sort((a, b) => a.price - b.price).slice(0, 4),
    };
  }

  // ── Sale / deals ──
  if (/\b(sale|discount|deal|offer|promo|cheap|affordable|save money)\b/.test(msg)) {
    const found = products.filter(p => p.discount > 0).sort((a, b) => b.discount - a.discount);
    const maxDisc = Math.max(...found.map(p => p.discount));
    return {
      message: `🔥 We have **${found.length} items on sale** — up to **${maxDisc}% off**! Here are the best deals:`,
      action: null,
      products: found.slice(0, 4),
    };
  }

  // ── Best / top rated ──
  if (/\b(best|top rated|highest rated|most popular|trending|popular|top picks)\b/.test(msg)) {
    const found = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4);
    return {
      message: `⭐ Our **highest-rated** products right now:`,
      action: null,
      products: found,
    };
  }

  // ── New arrivals ──
  if (/\b(new|latest|newest|just in|fresh|recent)\b/.test(msg)) {
    const found = products.filter(p => p.tags.some(t => /new/i.test(t))).slice(0, 4);
    return {
      message: `✨ Here are our **newest arrivals**:`,
      action: null,
      products: found.length > 0 ? found : products.slice(-4),
    };
  }

  // ── Category searches ──
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
      if (found.length > 0) {
        return {
          message: `Here are our **${category}** picks:`,
          action: null,
          products: found,
        };
      }
    }
  }

  // ── Occasion / style ──
  if (/\b(night out|party|evening|formal|gala|dinner)\b/.test(msg)) {
    const found = products.filter(p => ['Apparel', 'Accessories'].includes(p.category)).sort((a, b) => b.price - a.price).slice(0, 4);
    return { message: `For a **night out**, I'd suggest these elevated pieces:`, action: null, products: found };
  }
  if (/\b(casual|everyday|daily|weekend|relaxed)\b/.test(msg)) {
    const found = products.filter(p => p.price < 300).sort((a, b) => b.rating - a.rating).slice(0, 4);
    return { message: `For a **casual everyday** look, these are perfect:`, action: null, products: found };
  }
  if (/\b(gift|present|someone|friend|partner|him|her)\b/.test(msg)) {
    const found = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4);
    return { message: `🎁 Great gift ideas from our collection:`, action: null, products: found };
  }
  if (/\b(sustainable|eco|green|organic|environment)\b/.test(msg)) {
    const found = products.filter(p => p.tags.some(t => /sustainable|eco|organic/i.test(t)));
    return {
      message: found.length > 0
        ? `🌿 Our **sustainable** picks:`
        : `We're working on expanding our eco range! Here are our most mindfully made items:`,
      action: null,
      products: found.length > 0 ? found : products.filter(p => p.brand === 'EcoCore'),
    };
  }

  // ── Specific product lookup ──
  const fuzzy = fuzzyFind(products, msg);
  if (fuzzy.length > 0 && fuzzy[0] && score(fuzzy[0], msg) >= 5) {
    const p = fuzzy[0];
    return {
      message: `I found **${p.name}** — ${p.description.split('.')[0]}. It's **$${p.price}** and rated **${p.rating}⭐**.\n\nWant me to add it to your cart?`,
      action: null,
      products: fuzzy.slice(0, 3),
    };
  }

  // ── Shipping / returns / help ──
  if (/\b(shipping|delivery|ship|deliver)\b/.test(msg)) {
    return { message: "We offer **free standard shipping** on orders over $500 (3–5 business days), and **Express AI Logistics** for next-day delivery at $25. All orders are carbon-neutral. 🌿", action: null, products: [] };
  }
  if (/\b(return|refund|exchange)\b/.test(msg)) {
    return { message: "We have a **30-day hassle-free return policy**. Items must be unworn with original tags. Refunds are processed within 5–7 business days. Need help with a specific order?", action: null, products: [] };
  }
  if (/\b(size|sizing|fit|measurement)\b/.test(msg)) {
    return { message: "Our sizing varies by category:\n\n• **Apparel/Outerwear:** XS–XXL\n• **Footwear:** US 7–12\n• **Accessories:** One Size\n\nNeed sizing for a specific item? Just ask!", action: null, products: [] };
  }

  // ── Default: show top picks + help ──
  return {
    message: "I'm here to help you shop smarter! ✨ Try asking:\n\n• *\"Show me jackets under $500\"*\n• *\"Add the watch to my cart\"*\n• *\"What's on sale?\"*\n• *\"Recommend something for a night out\"*\n• *\"Compare the sneakers\"*",
    action: null,
    products: [...products].sort((a, b) => b.rating - a.rating).slice(0, 3),
  };
}
