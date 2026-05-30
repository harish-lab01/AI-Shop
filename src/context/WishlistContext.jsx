import { createContext, useContext, useReducer } from 'react';

const WishlistContext = createContext(null);

const wishlistReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_WISHLIST':
      if (state.items.find((i) => i.id === action.payload.id)) return state;
      return { ...state, items: [...state.items, action.payload] };
    case 'REMOVE_FROM_WISHLIST':
      return { ...state, items: state.items.filter((i) => i.id !== action.payload) };
    case 'TOGGLE_WISHLIST': {
      const exists = state.items.find((i) => i.id === action.payload.id);
      if (exists) {
        return { ...state, items: state.items.filter((i) => i.id !== action.payload.id) };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    default:
      return state;
  }
};

export const WishlistProvider = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, { items: [] });

  const addToWishlist = (product) =>
    dispatch({ type: 'ADD_TO_WISHLIST', payload: product });

  const removeFromWishlist = (id) =>
    dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: id });

  const toggleWishlist = (product) =>
    dispatch({ type: 'TOGGLE_WISHLIST', payload: product });

  const isInWishlist = (id) => state.items.some((i) => i.id === id);

  return (
    <WishlistContext.Provider
      value={{ wishlistItems: state.items, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
