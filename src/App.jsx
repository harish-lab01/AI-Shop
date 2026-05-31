import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Chatbot from './components/Chatbot/Chatbot';
import Home from './pages/Home/Home';
import HomeAnimated from './pages/HomeAnimated/HomeAnimated';
import FashionApparel from './pages/FashionApparel/FashionApparel';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import ShoppingCart from './pages/ShoppingCart/ShoppingCart';
import Checkout from './pages/Checkout/Checkout';
import Wishlist from './pages/Wishlist/Wishlist';
import UserDashboard from './pages/UserDashboard/UserDashboard';
import { useChatbot } from './context/ChatbotContext';

const MINIMAL_NAV_ROUTES = ['/checkout'];
const NO_FOOTER_ROUTES = ['/checkout', '/dashboard'];

function AppInner() {
  const location = useLocation();
  const { setPage } = useChatbot();
  const isMinimalNav = MINIMAL_NAV_ROUTES.includes(location.pathname);
  const showFooter = !NO_FOOTER_ROUTES.some((r) => location.pathname.startsWith(r));

  // Scroll to top + tell chatbot which page we're on
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setPage(location.pathname);
  }, [location.pathname, setPage]);

  return (
    <>
      {isMinimalNav ? (
        <header style={{
          position: 'fixed', top: 0, width: '100%', zIndex: 50,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 var(--space-3xl)', height: '80px',
          background: 'rgba(17,19,24,0.1)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--color-on-surface)' }}>
            ShopMind AI
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>
              Need assistance?
            </span>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-on-surface-variant)', cursor: 'pointer' }}>help_outline</span>
          </div>
        </header>
      ) : (
        <Navbar />
      )}

      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/animated"      element={<HomeAnimated />} />
        <Route path="/shop"          element={<FashionApparel />} />
        <Route path="/product/:id"   element={<ProductDetail />} />
        <Route path="/cart"          element={<ShoppingCart />} />
        <Route path="/checkout"      element={<Checkout />} />
        <Route path="/wishlist"      element={<Wishlist />} />
        <Route path="/dashboard"     element={<UserDashboard />} />
      </Routes>

      {showFooter && <Footer />}

      {/* Global AI Chatbot — always visible */}
      <Chatbot />
    </>
  );
}

export default function App() {
  return <AppInner />;
}
