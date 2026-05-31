import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useChatbot } from '../../context/ChatbotContext';
import { useCart } from '../../context/CartContext';
import styles from './Chatbot.module.css';

// ── Markdown-lite renderer ─────────────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^• /gm, '&#8226; ');
}

// ── Quick action chips ─────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: '🔥 What\'s on sale?', msg: 'What products are on sale right now?' },
  { label: '⭐ Top rated', msg: 'Show me your best rated products' },
  { label: '🛒 My cart', msg: 'What\'s in my cart?' },
  { label: '❤️ My wishlist', msg: 'Show my wishlist' },
  { label: '👟 Footwear', msg: 'Show me all footwear' },
  { label: '🧥 Outerwear', msg: 'Show me jackets and coats' },
];

// ── Product mini-card ──────────────────────────────────────────────────────────
function ProductMiniCard({ product, onAddToCart }) {
  return (
    <Link to={`/product/${product.id}`} className={styles.miniCard}>
      <div className={styles.miniCardImg}>
        <img src={product.image} alt={product.name} />
        {product.discount > 0 && (
          <span className={styles.miniCardBadge}>-{product.discount}%</span>
        )}
      </div>
      <div className={styles.miniCardInfo}>
        <p className={styles.miniCardName}>{product.name}</p>
        <div className={styles.miniCardBottom}>
          <span className={styles.miniCardPrice}>${product.price}</span>
          <button
            className={styles.miniCardAdd}
            onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
            title="Add to cart"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_shopping_cart</span>
          </button>
        </div>
      </div>
    </Link>
  );
}

// ── Action button ──────────────────────────────────────────────────────────────
function ActionButton({ action, executeAction }) {
  if (!action) return null;
  const labels = {
    NAVIGATE: action.payload?.label || 'Go',
    ADD_TO_CART: 'Added to Cart ✓',
    ADD_TO_WISHLIST: 'Saved to Wishlist ✓',
    SHOW_PRODUCTS: 'View Products',
  };
  if (action.type === 'ADD_TO_CART' || action.type === 'ADD_TO_WISHLIST') return null; // auto-executed
  return (
    <button className={styles.actionBtn} onClick={() => executeAction(action)}>
      {action.type === 'NAVIGATE' && <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>}
      {labels[action.type] || 'Action'}
    </button>
  );
}

// ── Single message bubble ──────────────────────────────────────────────────────
function MessageBubble({ msg, executeAction, onAddToCart }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`${styles.msgRow} ${isUser ? styles.msgRowUser : styles.msgRowBot}`}>
      {!isUser && (
        <div className={styles.botAvatar}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
        </div>
      )}
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleBot}`}>
        <p
          className={styles.bubbleText}
          dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(msg.content)}</p>` }}
        />

        {/* Product cards */}
        {msg.products && msg.products.length > 0 && (
          <div className={styles.productGrid}>
            {msg.products.slice(0, 4).map(p => (
              <ProductMiniCard key={p.id} product={p} onAddToCart={onAddToCart} />
            ))}
          </div>
        )}

        {/* Action button */}
        {msg.action && (
          <ActionButton action={msg.action} executeAction={executeAction} />
        )}

        <span className={styles.timestamp}>
          {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// ── Typing indicator ───────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className={`${styles.msgRow} ${styles.msgRowBot}`}>
      <div className={styles.botAvatar}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
      </div>
      <div className={`${styles.bubble} ${styles.bubbleBot} ${styles.typingBubble}`}>
        <div className={styles.typingDots}>
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

// ── Main Chatbot component ─────────────────────────────────────────────────────
export default function Chatbot() {
  const { isOpen, isMinimized, messages, isTyping, sendMessage, executeAction, toggle, close, minimize, clearChat } = useChatbot();
  const { addToCart } = useCart();
  const [input, setInput] = useState('');
  const [showQuick, setShowQuick] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    setShowQuick(false);
    sendMessage(input.trim());
    setInput('');
  };

  const handleQuick = (msg) => {
    setShowQuick(false);
    sendMessage(msg);
  };

  const handleAddToCart = (product) => {
    addToCart(product, product.sizes?.[0] || 'One Size');
  };

  const hasUserMessages = messages.some(m => m.role === 'user');

  return (
    <>
      {/* ── FAB Button ── */}
      <button
        className={`${styles.fab} ${isOpen ? styles.fabOpen : ''}`}
        onClick={toggle}
        aria-label="Open AI Chat"
      >
        <div className={styles.fabInner}>
          {isOpen
            ? <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
            : <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          }
        </div>
        {!isOpen && <div className={styles.fabPulse} />}
        {!isOpen && <span className={styles.fabLabel}>AI Stylist</span>}
      </button>

      {/* ── Chat Window ── */}
      {isOpen && (
        <div className={`${styles.window} ${isMinimized ? styles.windowMinimized : ''}`}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.headerAvatar}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-on-primary)', fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              </div>
              <div>
                <p className={styles.headerName}>ShopMind AI</p>
                <p className={styles.headerStatus}>
                  <span className={styles.statusDot} />
                  {isTyping ? 'Thinking...' : 'Online · Always here to help'}
                </p>
              </div>
            </div>
            <div className={styles.headerActions}>
              {hasUserMessages && (
                <button className={styles.headerBtn} onClick={clearChat} title="Clear chat">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>restart_alt</span>
                </button>
              )}
              <button className={styles.headerBtn} onClick={minimize} title="Minimize">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{isMinimized ? 'expand_less' : 'remove'}</span>
              </button>
              <button className={styles.headerBtn} onClick={close} title="Close">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className={styles.messages}>
                {messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    executeAction={executeAction}
                    onAddToCart={handleAddToCart}
                  />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              {showQuick && messages.length <= 1 && (
                <div className={styles.quickActions}>
                  <p className={styles.quickLabel}>Quick actions</p>
                  <div className={styles.quickGrid}>
                    {QUICK_ACTIONS.map(qa => (
                      <button key={qa.label} className={styles.quickChip} onClick={() => handleQuick(qa.msg)}>
                        {qa.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className={styles.inputArea}>
                <div className={styles.inputWrapper}>
                  <input
                    ref={inputRef}
                    className={styles.input}
                    placeholder="Ask me anything about the store..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    disabled={isTyping}
                  />
                  <button
                    className={`${styles.sendBtn} ${input.trim() && !isTyping ? styles.sendBtnActive : ''}`}
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    aria-label="Send"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
                  </button>
                </div>
                <p className={styles.inputHint}>Powered by Gemini AI · Can add to cart, navigate & more</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
