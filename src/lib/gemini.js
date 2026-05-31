import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Gemini client ──────────────────────────────────────────────────────────────
// Uses the free gemini-1.5-flash model. The API key is embedded here for the
// demo; in production move it to an environment variable.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

let genAI = null;
let model = null;

function getModel() {
  if (!API_KEY) return null;
  if (!genAI) genAI = new GoogleGenerativeAI(API_KEY);
  if (!model) model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  return model;
}

// ── Build the system prompt with live store context ────────────────────────────
export function buildSystemPrompt({ products, cartItems, wishlistItems, currentPage, cartTotal }) {
  const productCatalog = products.map(p =>
    `• [ID:${p.id}] ${p.name} | ${p.category} | $${p.price} | Brand: ${p.brand} | Color: ${p.color} | Rating: ${p.rating}★ (${p.reviewCount} reviews) | ${p.discount > 0 ? `SALE: ${p.discount}% off (was $${p.originalPrice})` : 'Full price'} | Sizes: ${p.sizes.join(', ')} | ${p.inStock ? 'In Stock' : 'Out of Stock'} | Tags: ${p.tags.join(', ')}`
  ).join('\n');

  const cartSummary = cartItems.length === 0
    ? 'Cart is empty.'
    : cartItems.map(i => `• ${i.name} (${i.size}) × ${i.quantity} = $${(i.price * i.quantity).toFixed(2)}`).join('\n') +
      `\nCart Total: $${cartTotal.toFixed(2)}`;

  const wishlistSummary = wishlistItems.length === 0
    ? 'Wishlist is empty.'
    : wishlistItems.map(i => `• ${i.name} ($${i.price})`).join('\n');

  return `You are ShopMind AI — an intelligent, friendly personal shopping assistant for a premium dark-luxury fashion marketplace. You have FULL access to the store and can take real actions.

## YOUR CAPABILITIES
You can:
1. **Search & recommend products** — find items by name, category, price, style, occasion, brand
2. **Add to cart** — when user says "add X to cart", respond with action JSON
3. **Add to wishlist** — when user says "save/wishlist X", respond with action JSON
4. **Navigate** — send user to any page (shop, cart, checkout, wishlist, dashboard, product page)
5. **Answer questions** — about products, sizing, shipping, returns, the brand
6. **Compare products** — side-by-side comparisons
7. **Style advice** — outfit suggestions, occasion-based recommendations
8. **Cart management** — tell user what's in their cart, total, suggest checkout

## CURRENT STORE STATE
**Page:** ${currentPage}
**Cart:**
${cartSummary}
**Wishlist:**
${wishlistSummary}

## FULL PRODUCT CATALOG
${productCatalog}

## RESPONSE FORMAT
Always respond in this JSON format:
{
  "message": "Your conversational response here (can use markdown: **bold**, *italic*, bullet lists)",
  "action": null | {
    "type": "ADD_TO_CART" | "ADD_TO_WISHLIST" | "NAVIGATE" | "SHOW_PRODUCTS" | "REMOVE_FROM_CART",
    "payload": {
      // For ADD_TO_CART: { productId: number, size: string }
      // For ADD_TO_WISHLIST: { productId: number }
      // For NAVIGATE: { path: string, label: string }
      // For SHOW_PRODUCTS: { productIds: number[] }
      // For REMOVE_FROM_CART: { productId: number, size: string }
    }
  },
  "products": [] | [{ id, name, price, image, category }]  // products to display as cards
}

## RULES
- Be concise, warm, and knowledgeable — like a luxury personal stylist
- When recommending products, always include them in the "products" array so they render as cards
- When taking an action (add to cart, navigate), ALWAYS confirm it in your message
- If the user asks to add something to cart, find the best matching product and include the action
- Never make up products — only use the catalog above
- For sizing questions, reference the actual sizes available
- For price questions, use exact prices from the catalog
- Keep responses under 150 words unless doing a detailed comparison
- If no API key is set, still respond helpfully using the catalog data`;
}

// ── Send message to Gemini ─────────────────────────────────────────────────────
export async function sendToGemini({ userMessage, history, storeContext }) {
  const m = getModel();

  // If no API key, use smart local fallback
  if (!m) {
    return localFallback(userMessage, storeContext);
  }

  const systemPrompt = buildSystemPrompt(storeContext);

  // Build conversation history for multi-turn
  const chatHistory = history.slice(-10).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.role === 'user' ? msg.content : msg.rawContent || msg.content }],
  }));

  try {
    const chat = m.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
      systemInstruction: systemPrompt,
    });

    const result = await chat.sendMessage(userMessage);
    const text = result.response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return { message: text, action: null, products: [] };
      }
    }
    return { message: text, action: null, products: [] };
  } catch (err) {
    console.error('Gemini error:', err);
    return localFallback(userMessage, storeContext);
  }
}

// ── Smart local fallback (works without API key) ───────────────────────────────
function localFallback(userMessage, { products, cartItems, wishlistItems, cartTotal }) {
  const msg = userMessage.toLowerCase();

  // Cart queries
  if (msg.includes('cart') && (msg.includes('what') || msg.includes('show') || msg.includes('my'))) {
    if (cartItems.length === 0) {
      return { message: "Your cart is currently empty. Want me to recommend something? 🛍️", action: null, products: [] };
    }
    const list = cartItems.map(i => `**${i.name}** (${i.size}) × ${i.quantity} — $${(i.price * i.quantity).toFixed(2)}`).join('\n');
    return {
      message: `Here's what's in your cart:\n\n${list}\n\n**Total: $${cartTotal.toFixed(2)}**`,
      action: { type: 'NAVIGATE', payload: { path: '/cart', label: 'View Cart' } },
      products: [],
    };
  }

  // Wishlist queries
  if (msg.includes('wishlist') && (msg.includes('what') || msg.includes('show') || msg.includes('my'))) {
    if (wishlistItems.length === 0) {
      return { message: "Your wishlist is empty. Browse the shop and save items you love! ❤️", action: null, products: [] };
    }
    const list = wishlistItems.map(i => `**${i.name}** — $${i.price}`).join('\n');
    return {
      message: `Your wishlist:\n\n${list}`,
      action: { type: 'NAVIGATE', payload: { path: '/wishlist', label: 'View Wishlist' } },
      products: wishlistItems.slice(0, 4),
    };
  }

  // Add to cart
  const addCartMatch = msg.match(/add (.+?) to (?:my )?cart/);
  if (addCartMatch) {
    const query = addCartMatch[1];
    const found = products.find(p =>
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query)
    );
    if (found) {
      return {
        message: `Added **${found.name}** to your cart! 🛒 It's $${found.price}.`,
        action: { type: 'ADD_TO_CART', payload: { productId: found.id, size: found.sizes[0] } },
        products: [found],
      };
    }
  }

  // Add to wishlist
  const wishMatch = msg.match(/(?:save|wishlist|add) (.+?) (?:to (?:my )?wishlist|for later)/);
  if (wishMatch) {
    const query = wishMatch[1];
    const found = products.find(p =>
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
    if (found) {
      return {
        message: `Saved **${found.name}** to your wishlist! ❤️`,
        action: { type: 'ADD_TO_WISHLIST', payload: { productId: found.id } },
        products: [found],
      };
    }
  }

  // Navigate to checkout
  if (msg.includes('checkout') || msg.includes('buy now') || msg.includes('purchase')) {
    return {
      message: cartItems.length > 0
        ? `Ready to checkout! You have ${cartItems.length} item(s) totaling **$${cartTotal.toFixed(2)}**. Let's complete your order! 🎉`
        : "Your cart is empty. Add some items first and I'll take you to checkout!",
      action: cartItems.length > 0 ? { type: 'NAVIGATE', payload: { path: '/checkout', label: 'Go to Checkout' } } : null,
      products: [],
    };
  }

  // Category searches
  const categories = ['footwear', 'shoes', 'sneakers', 'outerwear', 'jacket', 'coat', 'accessories', 'watch', 'bag', 'apparel', 'electronics', 'headphones'];
  for (const cat of categories) {
    if (msg.includes(cat)) {
      const catMap = { shoes: 'Footwear', sneakers: 'Footwear', footwear: 'Footwear', jacket: 'Outerwear', coat: 'Outerwear', outerwear: 'Outerwear', watch: 'Accessories', bag: 'Accessories', accessories: 'Accessories', apparel: 'Apparel', electronics: 'Electronics', headphones: 'Electronics' };
      const category = catMap[cat] || cat;
      const found = products.filter(p => p.category.toLowerCase() === category.toLowerCase()).slice(0, 4);
      if (found.length > 0) {
        return {
          message: `Here are our top **${category}** picks for you:`,
          action: { type: 'SHOW_PRODUCTS', payload: { productIds: found.map(p => p.id) } },
          products: found,
        };
      }
    }
  }

  // Price-based search
  const underMatch = msg.match(/under \$?(\d+)/);
  if (underMatch) {
    const maxPrice = parseInt(underMatch[1]);
    const found = products.filter(p => p.price <= maxPrice).slice(0, 4);
    return {
      message: `Here are items under **$${maxPrice}**:`,
      action: null,
      products: found,
    };
  }

  // Sale / discount
  if (msg.includes('sale') || msg.includes('discount') || msg.includes('deal') || msg.includes('cheap')) {
    const found = products.filter(p => p.discount > 0).slice(0, 4);
    return {
      message: `Here are our current **sale items** — up to ${Math.max(...found.map(p => p.discount))}% off:`,
      action: null,
      products: found,
    };
  }

  // Best rated
  if (msg.includes('best') || msg.includes('top rated') || msg.includes('popular') || msg.includes('recommend')) {
    const found = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4);
    return {
      message: `Here are our **highest-rated** products:`,
      action: null,
      products: found,
    };
  }

  // Navigate to shop
  if (msg.includes('shop') || msg.includes('browse') || msg.includes('collection')) {
    return {
      message: "Let me take you to our full collection! 🛍️",
      action: { type: 'NAVIGATE', payload: { path: '/shop', label: 'Browse Shop' } },
      products: [],
    };
  }

  // Greeting
  if (msg.match(/^(hi|hello|hey|sup|yo|good morning|good evening)/)) {
    return {
      message: "Hey! 👋 I'm your ShopMind AI stylist. I can help you find products, add items to your cart, check your wishlist, or answer any questions about our collection. What are you looking for today?",
      action: null,
      products: [],
    };
  }

  // Default
  const topPicks = [...products].sort((a, b) => b.rating - a.rating).slice(0, 3);
  return {
    message: "I'm here to help you shop smarter! Try asking me things like:\n\n• *\"Show me jackets under $500\"*\n• *\"Add the watch to my cart\"*\n• *\"What's on sale?\"*\n• *\"Recommend something for a night out\"*",
    action: null,
    products: topPicks,
  };
}
