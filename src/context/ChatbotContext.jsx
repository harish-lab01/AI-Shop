import { createContext, useContext, useReducer, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendToGemini } from '../lib/gemini';
import { useCart } from './CartContext';
import { useWishlist } from './WishlistContext';
import { products, getProductById } from '../data/products';

const ChatbotContext = createContext(null);

const initialState = {
  isOpen: false,
  isMinimized: false,
  messages: [
    {
      id: 1,
      role: 'assistant',
      content: "Hey! 👋 I'm **ShopMind AI** — your personal stylist.\n\nTry: *\"Add the watch to my cart\"*, *\"Show me jackets under $500\"*, or *\"What's on sale?\"*",
      products: [],
      action: null,
      timestamp: new Date(),
    },
  ],
  isTyping: false,
  currentPage: '/',
  toast: null, // { message, type: 'success'|'error' }
};

function chatReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_OPEN':  return { ...state, isOpen: !state.isOpen, isMinimized: false };
    case 'OPEN':         return { ...state, isOpen: true, isMinimized: false };
    case 'CLOSE':        return { ...state, isOpen: false };
    case 'MINIMIZE':     return { ...state, isMinimized: !state.isMinimized };
    case 'ADD_MESSAGE':  return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_TYPING':   return { ...state, isTyping: action.payload };
    case 'SET_PAGE':     return { ...state, currentPage: action.payload };
    case 'SET_TOAST':    return { ...state, toast: action.payload };
    case 'CLEAR':        return { ...state, messages: [initialState.messages[0]] };
    default:             return state;
  }
}

export function ChatbotProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { cartItems, cartTotal, addToCart, removeFromCart } = useCart();
  const { wishlistItems, addToWishlist } = useWishlist();
  const navigate = useNavigate();

  // ── Resolve product from action payload (handles both productId and id) ──
  const resolveProduct = useCallback((payload) => {
    const id = payload?.productId ?? payload?.id;
    if (!id) return null;
    return getProductById(Number(id));
  }, []);

  // ── Execute action returned by AI ─────────────────────────────────────────
  const executeAction = useCallback((action) => {
    if (!action?.type) return;

    switch (action.type) {
      case 'ADD_TO_CART': {
        const product = resolveProduct(action.payload);
        if (product) {
          const size = action.payload?.size || product.sizes[0] || 'One Size';
          addToCart(product, size);
          // Show toast
          dispatch({ type: 'SET_TOAST', payload: { message: `✅ ${product.name} added to cart!`, type: 'success' } });
          setTimeout(() => dispatch({ type: 'SET_TOAST', payload: null }), 3000);
        } else {
          console.warn('[ChatbotContext] ADD_TO_CART: product not found', action.payload);
        }
        break;
      }
      case 'ADD_TO_WISHLIST': {
        const product = resolveProduct(action.payload);
        if (product) {
          addToWishlist(product);
          dispatch({ type: 'SET_TOAST', payload: { message: `❤️ ${product.name} saved to wishlist!`, type: 'success' } });
          setTimeout(() => dispatch({ type: 'SET_TOAST', payload: null }), 3000);
        }
        break;
      }
      case 'NAVIGATE':
        if (action.payload?.path) navigate(action.payload.path);
        break;
      case 'REMOVE_FROM_CART':
        removeFromCart(action.payload?.productId ?? action.payload?.id, action.payload?.size);
        break;
      default:
        break;
    }
  }, [resolveProduct, addToCart, addToWishlist, navigate, removeFromCart]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim()) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMsg });
    dispatch({ type: 'SET_TYPING', payload: true });

    // Build history (skip initial greeting)
    const history = state.messages.slice(1).map(m => ({
      role: m.role,
      content: m.content,
      rawContent: m.rawContent,
    }));

    try {
      const response = await sendToGemini({
        userMessage: userText,
        history,
        storeContext: {
          products,
          cartItems,
          wishlistItems,
          currentPage: state.currentPage,
          cartTotal,
        },
      });

      // Resolve product objects for display cards
      const displayProducts = (response.products || [])
        .map(p => {
          if (p?.id) return getProductById(Number(p.id)) || p;
          return p;
        })
        .filter(Boolean);

      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.message || "I'm not sure about that. Try asking about products, your cart, or style advice!",
        rawContent: JSON.stringify(response),
        products: displayProducts,
        action: response.action || null,
        timestamp: new Date(),
      };

      dispatch({ type: 'ADD_MESSAGE', payload: assistantMsg });

      // Execute action immediately
      if (response.action) {
        executeAction(response.action);
      }
    } catch (err) {
      console.error('[ChatbotContext] sendMessage error:', err);
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: Date.now() + 1,
          role: 'assistant',
          content: "Sorry, something went wrong. Please try again!",
          products: [],
          action: null,
          timestamp: new Date(),
        },
      });
    } finally {
      dispatch({ type: 'SET_TYPING', payload: false });
    }
  }, [state.messages, state.currentPage, cartItems, wishlistItems, cartTotal, executeAction]);

  const value = {
    ...state,
    sendMessage,
    executeAction,
    open:      () => dispatch({ type: 'OPEN' }),
    close:     () => dispatch({ type: 'CLOSE' }),
    toggle:    () => dispatch({ type: 'TOGGLE_OPEN' }),
    minimize:  () => dispatch({ type: 'MINIMIZE' }),
    setPage:   (page) => dispatch({ type: 'SET_PAGE', payload: page }),
    clearChat: () => dispatch({ type: 'CLEAR' }),
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
      {/* Global toast notification */}
      {state.toast && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: state.toast.type === 'success' ? 'rgba(0,136,93,0.95)' : 'rgba(147,0,10,0.95)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '999px',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          fontWeight: 600,
          zIndex: 9998,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          whiteSpace: 'nowrap',
        }}>
          {state.toast.message}
        </div>
      )}
    </ChatbotContext.Provider>
  );
}

export const useChatbot = () => {
  const ctx = useContext(ChatbotContext);
  if (!ctx) throw new Error('useChatbot must be used within ChatbotProvider');
  return ctx;
};
