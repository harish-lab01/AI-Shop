# ShopMind AI — Intelligent Commerce Platform

A fully responsive, dark-luxury AI-powered marketplace built with **React 18 + Vite + React Router DOM v6**, pixel-matched to the Stitch design prototypes.

## ✨ Features

- **8 Pages** — Home, Home Animated, Fashion Apparel, Product Detail, Shopping Cart, Checkout, Wishlist, User Dashboard
- **Dark-Luxury Design System** — Glassmorphism, floating orbs, grain texture, CSS custom properties
- **Global State** — CartContext + WishlistContext via React Context + useReducer
- **Animations** — Word-reveal hero, scroll reveal, typewriter search, card hover lift, page fade-in, credit card flip
- **AI Stylist Panel** — Slide-in side panel with glassmorphism
- **Fully Responsive** — Mobile-first, works on all screen sizes

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 🗂 Routes

| Path | Page |
|------|------|
| `/` | Home |
| `/animated` | Home Animated |
| `/shop` | Fashion Apparel |
| `/product/:id` | Product Detail |
| `/cart` | Shopping Cart |
| `/checkout` | Checkout |
| `/wishlist` | Wishlist |
| `/dashboard` | User Dashboard |

## 🎨 Tech Stack

- React 18
- Vite 5
- React Router DOM v6
- CSS Modules
- No UI libraries — 100% custom components

## 🎨 Design Tokens

All colors, fonts, and spacing are defined in `src/styles/tokens.css` as CSS custom properties, extracted directly from the Stitch design system.

**Fonts:** Space Grotesk (display) · DM Sans (body) · JetBrains Mono (prices/labels)

**Primary:** `#c0c1ff` · **Secondary:** `#ffb2b7` · **Tertiary:** `#4edea3` · **Surface:** `#111318`
