import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useChatbot } from '../../context/ChatbotContext';
import { useCart } from '../../context/CartContext';
import styles from './Chatbot.module.css';

// ── Markdown-lite renderer ─────────────────────────────────────────────────────
function md(text = '') {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^• /gm, '&#8226;&nbsp;');
}

// ── Quick action chips ─────────────────────────────────────────────────────────
const QUICK = [
  { icon: '🔥', label: "What's on sale?",    msg: "What products are on sale right now?" },
  { icon: '⭐', label: 'Top rated',           msg: 'Show me your best rated products' },
  { icon: '🛒', label: 'My cart',             msg: "What's in my cart?" },
  { icon: '❤️', label: 'My wishlist',         msg: 'Show my wishlist' },
  { icon: '👟', label: 'Footwear',            msg: 'Show me all footwear' },
  { icon: '🧥', label: 'Outerwear',           msg: 'Show me jackets and coats' },
  { icon: '🎁', label: 'Gift ideas',          msg: 'I need a gift idea' },
  { icon: '💰', label: 'Under $300',          msg: 'Show me items under $300' },
];

// ── Product mini-card ──────────────────────────────────────────────────────────
function MiniCard({ product, onAdd }) {
  const [added, setAdded] = useState(false);
  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };
  return (
    <Link to={`/product/${product.id}`} className={styles.miniCard}>
      <div className={styles.miniImg}>
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.discount > 0 && <span className={styles.miniBadge}>-{product.discount}%</span>}
      </div>
      <div className={styles.miniInfo}>
        <p className={styles.miniName}>{product.name}</p>
        <div className={styles.miniRow}>
          <span className={styles.miniPrice}>${product.price}</span>
          <button className={`${styles.miniAdd} ${added ? styles.miniAdded : ''}`} onClick={handleAdd} title="Add to cart">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              {added ? 'check' : 'add_shopping_cart'}
            </span>
          </button>
        </div>
      </div>
    </Link>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────────
function Bubble({ msg, executeAction, onAdd }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`${styles.row} ${isUser ? styles.rowUser : styles.rowBot}`}>
      {!isUser && (
        <div className={styles.avatar}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
        </div>
      )}
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleBot}`}>
        <div
          className={styles.bubbleText}
          dangerouslySetInnerHTML={{ __html: `<p>${md(msg.content)}</p>` }}
        />

        {/* Product cards */}
        {msg.products?.length > 0 && (
          <div className={styles.cards}>
            {msg.products.slice(0, 4).map(p => (
              <MiniCard key={p.id} product={p} onAdd={onAdd} />
            ))}
          </div>
        )}

        {/* Navigate action button */}
        {msg.action?.type === 'NAVIGATE' && (
          <button className={styles.actionBtn} onClick={() => executeAction(msg.action)}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>arrow_forward</span>
            {msg.action.payload?.label || 'Go'}
          </button>
        )}

        <span className={styles.time}>
          {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// ── Typing dots ────────────────────────────────────────────────────────────────
function Typing() {
  return (
    <div className={`${styles.row} ${styles.rowBot}`}>
      <div className={styles.avatar}>
        <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
      </div>
      <div className={`${styles.bubble} ${styles.bubbleBot}`} style={{ padding: '12px 16px' }}>
        <div className={styles.dots}><span /><span /><span /></div>
      </div>
    </div>
  );
}

// ── Main Chatbot ───────────────────────────────────────────────────────────────
export default function Chatbot() {
  const { isOpen, isMinimized, messages, isTyping, sendMessage, executeAction, toggle, close, minimize, clearChat } = useChatbot();
  const { addToCart } = useCart();
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (isOpen && !isMinimized) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen, isMinimized]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isMinimized) setTimeout(() => inputRef.current?.focus(), 350);
  }, [isOpen, isMinimized]);

  // Voice input setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim() || isTyping) return;
    setShowQuick(false);
    sendMessage(input.trim());
    setInput('');
  }, [input, isTyping, sendMessage]);

  const handleQuick = useCallback((msg) => {
    setShowQuick(false);
    sendMessage(msg);
  }, [sendMessage]);

  const handleAddToCart = useCallback((product) => {
    addToCart(product, product.sizes?.[0] || 'One Size');
  }, [addToCart]);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const hasUserMsg = messages.some(m => m.role === 'user');
  const hasVoice = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <>
      {/* ── FAB ── */}
      <button className={`${styles.fab} ${isOpen ? styles.fabOpen : ''}`} onClick={toggle} aria-label="AI Chat">
        <div className={styles.fabIcon}>
          {isOpen
            ? <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
            : <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          }
        </div>
        {!isOpen && <span className={styles.fabText}>AI Stylist</span>}
        {!isOpen && <span className={styles.fabRing} />}
      </button>

      {/* ── Window ── */}
      {isOpen && (
        <div className={`${styles.win} ${isMinimized ? styles.winMin : ''}`}>

          {/* Header */}
          <div className={styles.hdr}>
            <div className={styles.hdrLeft}>
              <div className={styles.hdrAvatar}>
                <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'white', fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              </div>
              <div>
                <p className={styles.hdrName}>ShopMind AI</p>
                <p className={styles.hdrStatus}>
                  <span className={styles.dot} />
                  {isTyping ? 'Thinking...' : 'Online · Personal Stylist'}
                </p>
              </div>
            </div>
            <div className={styles.hdrBtns}>
              {hasUserMsg && (
                <button className={styles.hdrBtn} onClick={clearChat} title="New chat">
                  <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>restart_alt</span>
                </button>
              )}
              <button className={styles.hdrBtn} onClick={minimize} title={isMinimized ? 'Expand' : 'Minimize'}>
                <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>{isMinimized ? 'expand_less' : 'remove'}</span>
              </button>
              <button className={styles.hdrBtn} onClick={close} title="Close">
                <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>close</span>
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className={styles.msgs}>
                {messages.map(m => (
                  <Bubble key={m.id} msg={m} executeAction={executeAction} onAdd={handleAddToCart} />
                ))}
                {isTyping && <Typing />}
                <div ref={endRef} />
              </div>

              {/* Quick chips */}
              {showQuick && messages.length <= 1 && (
                <div className={styles.quick}>
                  <p className={styles.quickLabel}>Quick actions</p>
                  <div className={styles.quickWrap}>
                    {QUICK.map(q => (
                      <button key={q.label} className={styles.chip} onClick={() => handleQuick(q.msg)}>
                        <span>{q.icon}</span> {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className={styles.inputArea}>
                <div className={`${styles.inputBox} ${listening ? styles.inputBoxListening : ''}`}>
                  <input
                    ref={inputRef}
                    className={styles.input}
                    placeholder={listening ? '🎤 Listening...' : 'Ask me anything...'}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    disabled={isTyping}
                  />
                  {hasVoice && (
                    <button
                      className={`${styles.voiceBtn} ${listening ? styles.voiceBtnActive : ''}`}
                      onClick={toggleVoice}
                      title="Voice input"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        {listening ? 'mic' : 'mic_none'}
                      </span>
                    </button>
                  )}
                  <button
                    className={`${styles.sendBtn} ${input.trim() && !isTyping ? styles.sendBtnOn : ''}`}
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
                  </button>
                </div>
                <p className={styles.hint}>
                  {API_KEY_SET ? '✦ Powered by Gemini 2.0 Flash' : '✦ Smart AI · Add API key for Gemini'}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

// Check if API key is configured (for hint text)
const API_KEY_SET = !!import.meta.env.VITE_GEMINI_API_KEY;
