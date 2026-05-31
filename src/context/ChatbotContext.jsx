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
      content: "Hey! 👋 I'm **ShopMind AI** — your personal stylist. I can find products, add items to your cart, check deals, and help you shop smarter.\n\nTry asking me anything!",
      products: [],
      action: null,
      timestamp: new Date(),
    },
  ],
  isTyping: false,
  currentPage: '/',
};

function chatReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_OPEN':
      return { ...state, isOpen: !state.isOpen, isMinimized: false };
    case 'OPEN':
      return { ...state, isOpen: true, isMinimized: false };
    case 'CLOSE':
      return { ...state, isOpen: false };
    case 'MINIMIZE':
      return { ...state, isMinimized: !state.isMinimized };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
    case 'CLEAR':
      return { ...state, messages: [initialState.messages[0]] };
    default:
      return state;
  }
}

export function ChatbotProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { cartItems, cartTotal, addToCart, removeFromCart } = useCart();
  const { wishlistItems, addToWishlist } = useWishlist();
  const navigate = useNavigate();

  // Execute actions returned by the AI
  const executeAction = useCallback((action) => {
    if (!action) return;
    switch (action.type) {
      case 'ADD_TO_CART': {
        const product = getProductById(action.payload.productId);
        if (product) addToCart(product, action.payload.size || product.sizes[0]);
        break;
      }
      case 'ADD_TO_WISHLIST': {
        const product = getProductById(action.payload.productId);
        if (product) addToWishlist(product);
        break;
      }
      case 'NAVIGATE':
        navigate(action.payload.path);
        break;
      case 'REMOVE_FROM_CART':
        removeFromCart(action.payload.productId, action.payload.size);
        break;
      default:
        break;
    }
  }, [addToCart, addToWishlist, navigate, removeFromCart]);

  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim()) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMsg });
    dispatch({ type: 'SET_TYPING', payload: true });

    // Build history for multi-turn (exclude the initial greeting)
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

      // Resolve product objects for display
      const displayProducts = (response.products || []).map(p => {
        if (p.id) return getProductById(p.id) || p;
        return p;
      }).filter(Boolean);

      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.message || "I'm not sure about that. Try asking me about products, your cart, or style advice!",
        rawContent: JSON.stringify(response),
        products: displayProducts,
        action: response.action || null,
        timestamp: new Date(),
      };

      dispatch({ type: 'ADD_MESSAGE', payload: assistantMsg });

      // Auto-execute the action
      if (response.action) {
        executeAction(response.action);
      }
    } catch (err) {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: Date.now() + 1,
          role: 'assistant',
          content: "Sorry, I hit a snag. Try again in a moment!",
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
    open: () => dispatch({ type: 'OPEN' }),
    close: () => dispatch({ type: 'CLOSE' }),
    toggle: () => dispatch({ type: 'TOGGLE_OPEN' }),
    minimize: () => dispatch({ type: 'MINIMIZE' }),
    setPage: (page) => dispatch({ type: 'SET_PAGE', payload: page }),
    clearChat: () => dispatch({ type: 'CLEAR' }),
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
}

export const useChatbot = () => {
  const ctx = useContext(ChatbotContext);
  if (!ctx) throw new Error('useChatbot must be used within ChatbotProvider');
  return ctx;
};
