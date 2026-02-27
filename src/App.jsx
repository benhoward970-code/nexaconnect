/* ═══════════════════════════════════════════════════════════════
   NexaConnect — NDIS Provider-Participant Marketplace
   Vite + React Application
   ═══════════════════════════════════════════════════════════════ */

import React, { useState, useEffect, useReducer, useCallback, useMemo, useRef, createContext, useContext, Fragment } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
        XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase, isSupabaseConfigured } from './supabase';
import * as db from './db.js';
import { isStripeConfigured, redirectToCheckout, openBillingPortal } from './stripe.js';

/* ─── Phase 1: Foundation ─────────────────────────────────────── */

// ── Color Palette ──
const COLORS = {
  dark: {
    bg: '#0B0F1A',
    surface: '#111827',
    surfaceHover: '#1F2937',
    surfaceAlt: '#151C2C',
    border: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(59,130,246,0.3)',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    glass: 'rgba(17,24,39,0.8)',
    glassBorder: 'rgba(255,255,255,0.06)',
    overlay: 'rgba(0,0,0,0.6)',
    cardShadow: '0 8px 32px rgba(0,0,0,0.4)',
    navBg: 'rgba(11,15,26,0.9)',
  },
  light: {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceHover: '#F1F5F9',
    surfaceAlt: '#F9FAFB',
    border: 'rgba(0,0,0,0.06)',
    borderHover: 'rgba(59,130,246,0.25)',
    text: '#111827',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    glass: 'rgba(255,255,255,0.9)',
    glassBorder: 'rgba(0,0,0,0.04)',
    overlay: 'rgba(0,0,0,0.4)',
    cardShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)',
    navBg: 'rgba(255,255,255,0.92)',
  },
  primary: {
    50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD',
    400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8',
    800: '#1E40AF', 900: '#1E3A8A',
  },
  accent: {
    50: '#FFF7ED', 100: '#FFEDD5', 200: '#FED7AA', 300: '#FDBA74',
    400: '#FB923C', 500: '#F97316', 600: '#EA580C', 700: '#C2410C',
    800: '#9A3412', 900: '#7C2D12',
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  star: '#FBBF24',
  gradientPrimary: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
  gradientAccent: 'linear-gradient(135deg, #F97316, #EA580C)',
  gradientHero: 'linear-gradient(160deg, #F9FAFB 0%, #EFF6FF 40%, #DBEAFE 100%)',
  gradientText: 'linear-gradient(135deg, #3B82F6, #F97316)',
  gradientCard: 'linear-gradient(135deg, rgba(249,115,22,0.06), rgba(249,115,22,0.02))',
};

// ── Typography ──
const FONTS = {
  sans: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  display: "'Fraunces', Georgia, serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

const FONT_SIZES = {
  xs: '0.75rem', sm: '0.875rem', base: '1rem', md: '1.125rem',
  lg: '1.25rem', xl: '1.5rem', '2xl': '1.875rem', '3xl': '2.25rem',
  '4xl': '3rem', '5xl': '3.75rem', '6xl': '4.5rem',
};

// ── Spacing / Radius ──
const RADIUS = { sm: '6px', md: '10px', lg: '14px', xl: '20px', full: '9999px' };
const SPACING = { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', '2xl': '48px', '3xl': '64px' };

// ── Breakpoints ──
const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 };

// ── useResponsive Hook ──
function useResponsive() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    let t;
    const handle = () => { clearTimeout(t); t = setTimeout(() => setWidth(window.innerWidth), 100); };
    window.addEventListener('resize', handle);
    return () => { window.removeEventListener('resize', handle); clearTimeout(t); };
  }, []);
  return {
    width,
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    isWide: width >= BREAKPOINTS.xl,
  };
}

// ── Theme Context ──
const ThemeContext = createContext({ theme: 'dark', toggle: () => {} });
function useTheme() { return useContext(ThemeContext); }
function t(dark, light) {
  // helper used inside components that have access to theme
  return undefined; // replaced by inline usage
}

// ── Style Helpers ──
function glassStyle(theme) {
  const c = COLORS[theme];
  return {
    background: c.glass,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${c.glassBorder}`,
    borderRadius: RADIUS.lg,
  };
}

function cardStyle(theme) {
  const c = COLORS[theme];
  return {
    background: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: RADIUS.lg,
    boxShadow: c.cardShadow,
    transition: 'all 0.3s ease',
  };
}

function gradientText() {
  return {
    background: COLORS.gradientText,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };
}

// ── Inject Global Styles ──
const STYLE_ID = 'nexaconnect-styles';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes nc-fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes nc-fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes nc-fadeInDown { from { opacity: 0; transform: translateY(-24px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes nc-fadeInLeft { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes nc-fadeInRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes nc-scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
    @keyframes nc-slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes nc-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes nc-spin { to { transform: rotate(360deg); } }
    @keyframes nc-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes nc-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    @keyframes nc-gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    @keyframes nc-borderGlow {
      0%, 100% { border-color: rgba(59,130,246,0.3); box-shadow: 0 0 15px rgba(59,130,246,0.1); }
      50% { border-color: rgba(249,115,22,0.3); box-shadow: 0 0 15px rgba(249,115,22,0.1); }
    }

    .nc-animate-fade { animation: nc-fadeIn 0.5s ease forwards; }
    .nc-animate-fade-up { animation: nc-fadeInUp 0.6s ease forwards; }
    .nc-animate-scale { animation: nc-scaleIn 0.4s ease forwards; }
    .nc-animate-float { animation: nc-float 3s ease-in-out infinite; }

    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.3); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.5); }

    ::selection { background: rgba(59,130,246,0.3); color: inherit; }

    input, textarea, select { font-family: ${FONTS.sans}; }
    * { scrollbar-width: thin; scrollbar-color: rgba(59,130,246,0.3) transparent; }

    .nc-glass-hover:hover { border-color: rgba(59,130,246,0.3) !important; box-shadow: 0 8px 32px rgba(59,130,246,0.15) !important; }
    .nc-card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(59,130,246,0.2) !important; }
  `;
  document.head.appendChild(style);
}

// ── Icons (SVG inline) ──
const Icons = {
  search: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('circle',{cx:11,cy:11,r:8}),React.createElement('path',{d:'m21 21-4.3-4.3'})),
  x: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M18 6 6 18'}),React.createElement('path',{d:'m6 6 12 12'})),
  menu: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round'},React.createElement('path',{d:'M4 12h16'}),React.createElement('path',{d:'M4 6h16'}),React.createElement('path',{d:'M4 18h16'})),
  sun: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round'},React.createElement('circle',{cx:12,cy:12,r:4}),React.createElement('path',{d:'M12 2v2'}),React.createElement('path',{d:'M12 20v2'}),React.createElement('path',{d:'m4.93 4.93 1.41 1.41'}),React.createElement('path',{d:'m17.66 17.66 1.41 1.41'}),React.createElement('path',{d:'M2 12h2'}),React.createElement('path',{d:'M20 12h2'}),React.createElement('path',{d:'m6.34 17.66-1.41 1.41'}),React.createElement('path',{d:'m19.07 4.93-1.41 1.41'})),
  moon: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round'},React.createElement('path',{d:'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'})),
  chevronDown: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'m6 9 6 6 6-6'})),
  chevronRight: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'m9 18 6-6-6-6'})),
  chevronLeft: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'m15 18-6-6 6-6'})),
  home: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'}),React.createElement('polyline',{points:'9 22 9 12 15 12 15 22'})),
  users: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'}),React.createElement('circle',{cx:9,cy:7,r:4}),React.createElement('path',{d:'M22 21v-2a4 4 0 0 0-3-3.87'}),React.createElement('path',{d:'M16 3.13a4 4 0 0 1 0 7.75'})),
  user: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'}),React.createElement('circle',{cx:12,cy:7,r:4})),
  star: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:c,stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('polygon',{points:'12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'})),
  starEmpty: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('polygon',{points:'12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'})),
  heart: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'})),
  heartFilled: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:c,stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'})),
  mail: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('rect',{width:20,height:16,x:2,y:4,rx:2}),React.createElement('path',{d:'m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'})),
  calendar: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('rect',{width:18,height:18,x:3,y:4,rx:2}),React.createElement('path',{d:'M16 2v4'}),React.createElement('path',{d:'M8 2v4'}),React.createElement('path',{d:'M3 10h18'})),
  clock: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('circle',{cx:12,cy:12,r:10}),React.createElement('polyline',{points:'12 6 12 12 16 14'})),
  mapPin: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'}),React.createElement('circle',{cx:12,cy:10,r:3})),
  phone: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'})),
  check: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('polyline',{points:'20 6 9 17 4 12'})),
  checkCircle: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M22 11.08V12a10 10 0 1 1-5.93-9.14'}),React.createElement('polyline',{points:'22 4 12 14.01 9 11.01'})),
  alertCircle: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('circle',{cx:12,cy:12,r:10}),React.createElement('path',{d:'M12 8v4'}),React.createElement('path',{d:'M12 16h.01'})),
  settings: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'}),React.createElement('circle',{cx:12,cy:12,r:3})),
  barChart: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M12 20V10'}),React.createElement('path',{d:'M18 20V4'}),React.createElement('path',{d:'M6 20v-4'})),
  trendingUp: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('polyline',{points:'22 7 13.5 15.5 8.5 10.5 2 17'}),React.createElement('polyline',{points:'16 7 22 7 22 13'})),
  eye: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z'}),React.createElement('circle',{cx:12,cy:12,r:3})),
  shield: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'})),
  award: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('circle',{cx:12,cy:8,r:6}),React.createElement('path',{d:'M15.477 12.89 17 22l-5-3-5 3 1.523-9.11'})),
  zap: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('polygon',{points:'13 2 3 14 12 14 11 22 21 10 12 10 13 2'})),
  image: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('rect',{width:18,height:18,x:3,y:3,rx:2}),React.createElement('circle',{cx:9,cy:9,r:2}),React.createElement('path',{d:'m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'})),
  send: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'m22 2-7 20-4-9-9-4Z'}),React.createElement('path',{d:'M22 2 11 13'})),
  filter: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('polygon',{points:'22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3'})),
  grid: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('rect',{width:7,height:7,x:3,y:3,rx:1}),React.createElement('rect',{width:7,height:7,x:14,y:3,rx:1}),React.createElement('rect',{width:7,height:7,x:3,y:14,rx:1}),React.createElement('rect',{width:7,height:7,x:14,y:14,rx:1})),
  list: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M8 6h13'}),React.createElement('path',{d:'M8 12h13'}),React.createElement('path',{d:'M8 18h13'}),React.createElement('path',{d:'M3 6h.01'}),React.createElement('path',{d:'M3 12h.01'}),React.createElement('path',{d:'M3 18h.01'})),
  plus: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M5 12h14'}),React.createElement('path',{d:'M12 5v14'})),
  minus: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M5 12h14'})),
  edit: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'})),
  trash: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M3 6h18'}),React.createElement('path',{d:'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6'}),React.createElement('path',{d:'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'})),
  logout: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'}),React.createElement('polyline',{points:'16 17 21 12 16 7'}),React.createElement('line',{x1:21,y1:12,x2:9,y2:12})),
  dollarSign: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('line',{x1:12,y1:2,x2:12,y2:22}),React.createElement('path',{d:'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'})),
  creditCard: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('rect',{width:22,height:16,x:1,y:4,rx:2}),React.createElement('path',{d:'M1 10h22'})),
  bell: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'}),React.createElement('path',{d:'M10.3 21a1.94 1.94 0 0 0 3.4 0'})),
  globe: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('circle',{cx:12,cy:12,r:10}),React.createElement('path',{d:'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20'}),React.createElement('path',{d:'M2 12h20'})),
  briefcase: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('rect',{width:20,height:14,x:2,y:7,rx:2}),React.createElement('path',{d:'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'})),
  arrowRight: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M5 12h14'}),React.createElement('path',{d:'m12 5 7 7-7 7'})),
  arrowLeft: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M19 12H5'}),React.createElement('path',{d:'m12 19-7-7 7-7'})),
  externalLink: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'}),React.createElement('polyline',{points:'15 3 21 3 21 9'}),React.createElement('line',{x1:10,y1:14,x2:21,y2:3})),
  upload: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'}),React.createElement('polyline',{points:'17 8 12 3 7 8'}),React.createElement('line',{x1:12,y1:3,x2:12,y2:15})),
  download: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'}),React.createElement('polyline',{points:'7 10 12 15 17 10'}),React.createElement('line',{x1:12,y1:15,x2:12,y2:3})),
  messageCircle: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z'})),
  bookmark: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z'})),
  verified: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:c,stroke:'#fff',strokeWidth:2},React.createElement('path',{d:'M12 1l3.09 3.09L19 5l.91 3.91L23 12l-3.09 3.09L19 19l-3.91.91L12 23l-3.09-3.09L5 19l-.91-3.91L1 12l3.09-3.09L5 5l3.91-.91L12 1z',fill:c,stroke:'none'}),React.createElement('polyline',{points:'9 12 11 14 15 10',stroke:'#fff',strokeWidth:2.5})),
  crown: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z'}),React.createElement('path',{d:'M5 16h14v4H5z'})),
  activity: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('polyline',{points:'22 12 18 12 15 21 9 3 6 12 2 12'})),
  camera: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z'}),React.createElement('circle',{cx:12,cy:13,r:3})),
  shieldCheck: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'}),React.createElement('polyline',{points:'9 12 11 14 15 10'})),
  flag: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z'}),React.createElement('line',{x1:4,y1:22,x2:4,y2:15})),
  columns: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('rect',{width:9,height:18,x:2,y:3,rx:1}),React.createElement('rect',{width:9,height:18,x:13,y:3,rx:1})),
  paperclip: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48'})),
  fileText: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'}),React.createElement('polyline',{points:'14 2 14 8 20 8'}),React.createElement('line',{x1:16,y1:13,x2:8,y2:13}),React.createElement('line',{x1:16,y1:17,x2:8,y2:17}),React.createElement('line',{x1:10,y1:9,x2:8,y2:9})),
  gitCompare: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('circle',{cx:18,cy:18,r:3}),React.createElement('circle',{cx:6,cy:6,r:3}),React.createElement('path',{d:'M13 6h3a2 2 0 0 1 2 2v7'}),React.createElement('path',{d:'M11 18H8a2 2 0 0 1-2-2V9'}),React.createElement('polyline',{points:'15 9 18 6 21 9'}),React.createElement('polyline',{points:'9 15 6 18 3 15'})),
  receipt: (s=20,c='currentColor') => React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:c,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z'}),React.createElement('path',{d:'M16 8H8'}),React.createElement('path',{d:'M16 12H8'}),React.createElement('path',{d:'M12 16H8'})),
};

/* ─── Atomic Components ───────────────────────────────────────── */

function Button({ children, onClick, variant = 'primary', size = 'md', disabled, fullWidth, icon, style: sx, ...props }) {
  const { theme } = useTheme();
  const c = COLORS[theme];
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    fontFamily: FONTS.sans, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', borderRadius: RADIUS.md, transition: 'all 0.25s ease',
    opacity: disabled ? 0.5 : 1, width: fullWidth ? '100%' : undefined,
    fontSize: size === 'sm' ? FONT_SIZES.sm : size === 'lg' ? FONT_SIZES.md : FONT_SIZES.base,
    padding: size === 'sm' ? '8px 16px' : size === 'lg' ? '14px 28px' : '10px 22px',
    letterSpacing: '-0.01em',
  };
  const variants = {
    primary: { background: COLORS.primary[600], color: '#fff', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' },
    secondary: { background: c.surface, color: c.text, border: `1px solid ${c.border}` },
    ghost: { background: 'transparent', color: c.textSecondary },
    accent: { background: COLORS.gradientAccent, color: '#fff', boxShadow: '0 4px 15px rgba(249,115,22,0.3)' },
    danger: { background: COLORS.error, color: '#fff' },
    outline: { background: 'transparent', color: COLORS.primary[500], border: `1.5px solid ${c.border}` },
  };
  return React.createElement('button', {
    onClick: disabled ? undefined : onClick,
    style: { ...base, ...variants[variant], ...sx },
    onMouseEnter: (e) => { if (!disabled) e.target.style.transform = 'translateY(-1px)'; },
    onMouseLeave: (e) => { e.target.style.transform = 'translateY(0)'; },
    ...props,
  }, icon, children);
}

function Badge({ children, variant = 'default', size = 'sm', style: sx }) {
  const { theme } = useTheme();
  const c = COLORS[theme];
  const variants = {
    default: { background: `${COLORS.primary[500]}20`, color: COLORS.primary[400] },
    success: { background: `${COLORS.success}20`, color: COLORS.success },
    warning: { background: `${COLORS.warning}20`, color: COLORS.warning },
    error: { background: `${COLORS.error}20`, color: COLORS.error },
    info: { background: `${COLORS.info}20`, color: COLORS.info },
    premium: { background: 'linear-gradient(135deg, #F59E0B20, #EF444420)', color: '#F59E0B' },
    pro: { background: `${COLORS.primary[500]}20`, color: COLORS.primary[400] },
    professional: { background: `${COLORS.primary[500]}20`, color: COLORS.primary[400] },
    free: { background: `${c.textMuted}20`, color: c.textMuted },
    starter: { background: `${c.textMuted}20`, color: c.textMuted },
    verified: { background: `${COLORS.accent[500]}20`, color: COLORS.accent[500] },
  };
  return React.createElement('span', {
    style: {
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: size === 'xs' ? '2px 8px' : '4px 12px',
      borderRadius: RADIUS.full, fontWeight: 600,
      fontSize: size === 'xs' ? FONT_SIZES.xs : FONT_SIZES.sm,
      fontFamily: FONTS.sans, letterSpacing: '0.02em',
      ...variants[variant], ...sx,
    },
  }, children);
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('ErrorBoundary caught:', error, info); }
  render() {
    if (this.state.hasError) {
      return React.createElement('div', { style: { padding: '40px', textAlign: 'center', fontFamily: 'system-ui' } },
        React.createElement('h2', { style: { color: '#ef4444', marginBottom: '16px' } }, 'Something went wrong'),
        React.createElement('pre', { style: { background: '#1a1a2e', color: '#f87171', padding: '20px', borderRadius: '8px', textAlign: 'left', overflow: 'auto', maxHeight: '300px', fontSize: '13px' } },
          this.state.error?.toString() + '\n\n' + (this.state.error?.stack || '')),
        React.createElement('button', { onClick: () => this.setState({ hasError: false, error: null }), style: { marginTop: '16px', padding: '10px 24px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 } }, 'Try Again'),
      );
    }
    return this.props.children;
  }
}

function Card({ children, onClick, hover, glass, style: sx, className }) {
  const { theme } = useTheme();
  const base = glass ? glassStyle(theme) : cardStyle(theme);
  return React.createElement('div', {
    onClick,
    className: `${hover ? 'nc-card-hover' : ''} ${className || ''}`,
    style: { ...base, padding: SPACING.lg, cursor: onClick ? 'pointer' : undefined, ...sx },
  }, children);
}

function Input({ label, value, onChange, type = 'text', placeholder, icon, error, textarea, style: sx, ...props }) {
  const { theme } = useTheme();
  const c = COLORS[theme];
  const [focused, setFocused] = useState(false);
  const El = textarea ? 'textarea' : 'input';
  return React.createElement('div', { style: { marginBottom: '16px', ...sx } },
    label && React.createElement('label', {
      style: { display: 'block', marginBottom: '6px', fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text, fontFamily: FONTS.sans },
    }, label),
    React.createElement('div', { style: { position: 'relative' } },
      icon && React.createElement('span', {
        style: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: c.textMuted },
      }, icon),
      React.createElement(El, {
        type, value, placeholder,
        onChange: (e) => onChange && onChange(e.target.value),
        onFocus: () => setFocused(true),
        onBlur: () => setFocused(false),
        style: {
          width: '100%', padding: icon ? '10px 14px 10px 40px' : '10px 14px',
          background: c.surface, color: c.text, border: `1.5px solid ${focused ? COLORS.primary[500] : error ? COLORS.error : c.border}`,
          borderRadius: RADIUS.md, fontSize: FONT_SIZES.base, fontFamily: FONTS.sans,
          outline: 'none', transition: 'border-color 0.2s', resize: textarea ? 'vertical' : undefined,
          minHeight: textarea ? '100px' : undefined,
          boxShadow: focused ? `0 0 0 3px ${COLORS.primary[500]}20` : 'none',
        },
        ...props,
      }),
    ),
    error && React.createElement('p', { style: { color: COLORS.error, fontSize: FONT_SIZES.xs, marginTop: '4px' } }, error),
  );
}

function Select({ label, value, onChange, options, style: sx }) {
  const { theme } = useTheme();
  const c = COLORS[theme];
  return React.createElement('div', { style: { marginBottom: '16px', ...sx } },
    label && React.createElement('label', {
      style: { display: 'block', marginBottom: '6px', fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text },
    }, label),
    React.createElement('select', {
      value, onChange: (e) => onChange && onChange(e.target.value),
      style: {
        width: '100%', padding: '10px 14px', background: c.surface, color: c.text,
        border: `1.5px solid ${c.border}`, borderRadius: RADIUS.md, fontSize: FONT_SIZES.base,
        fontFamily: FONTS.sans, outline: 'none', cursor: 'pointer', appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
      },
    }, options.map((o, i) => React.createElement('option', { key: i, value: typeof o === 'string' ? o : o.value }, typeof o === 'string' ? o : o.label))),
  );
}

function Modal({ open, onClose, title, children, width = '500px' }) {
  const { theme } = useTheme();
  const c = COLORS[theme];
  if (!open) return null;
  return React.createElement('div', {
    onClick: onClose,
    style: {
      position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: c.overlay, animation: 'nc-fadeIn 0.2s ease',
    },
  },
    React.createElement('div', {
      onClick: (e) => e.stopPropagation(),
      style: {
        ...glassStyle(theme), width, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
        padding: SPACING.xl, animation: 'nc-scaleIn 0.3s ease', background: c.surface,
      },
    },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg } },
        React.createElement('h3', { style: { fontSize: FONT_SIZES.xl, fontWeight: 700, color: c.text } }, title),
        React.createElement('button', {
          onClick: onClose,
          style: { background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: '4px' },
        }, Icons.x()),
      ),
      children,
    ),
  );
}

function Avatar({ name, src, size = 40, style: sx }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  const hash = name ? name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  const hue = (hash * 37) % 360;
  return React.createElement('div', {
    style: {
      width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: src ? `url(${src}) center/cover` : `linear-gradient(135deg, hsl(${hue},70%,60%), hsl(${(hue+40)%360},70%,50%))`,
      color: '#fff', fontWeight: 700, fontSize: size * 0.38, fontFamily: FONTS.sans, flexShrink: 0, ...sx,
    },
  }, !src && initials);
}

function StarRating({ rating, size = 16, showValue, onChange }) {
  const { theme } = useTheme();
  const c = COLORS[theme];
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(React.createElement('span', {
      key: i,
      onClick: onChange ? () => onChange(i) : undefined,
      style: { cursor: onChange ? 'pointer' : 'default', display: 'inline-flex' },
    }, i <= Math.round(rating) ? Icons.star(size, COLORS.star) : Icons.starEmpty(size, c.textMuted)));
  }
  return React.createElement('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '2px' } },
    ...stars,
    showValue && React.createElement('span', {
      style: { marginLeft: '6px', fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text },
    }, rating.toFixed(1)),
  );
}

function SearchBar({ value, onChange, placeholder = 'Search...', style: sx }) {
  const { theme } = useTheme();
  const c = COLORS[theme];
  return React.createElement('div', {
    style: {
      display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px',
      background: c.surface, border: `1.5px solid ${c.border}`, borderRadius: RADIUS.lg,
      transition: 'border-color 0.2s', ...sx,
    },
  },
    React.createElement('span', { style: { color: c.textMuted, display: 'flex' } }, Icons.search(18)),
    React.createElement('input', {
      value, placeholder,
      onChange: (e) => onChange(e.target.value),
      style: {
        flex: 1, background: 'none', border: 'none', outline: 'none',
        color: c.text, fontSize: FONT_SIZES.base, fontFamily: FONTS.sans,
      },
    }),
    value && React.createElement('button', {
      onClick: () => onChange(''),
      style: { background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, display: 'flex' },
    }, Icons.x(16)),
  );
}

function FilterChip({ label, active, onClick }) {
  const { theme } = useTheme();
  const c = COLORS[theme];
  return React.createElement('button', {
    onClick,
    style: {
      padding: '6px 14px', borderRadius: RADIUS.full, cursor: 'pointer',
      background: active ? COLORS.primary[500] : c.surface,
      color: active ? '#fff' : c.textSecondary,
      border: `1px solid ${active ? COLORS.primary[500] : c.border}`,
      fontSize: FONT_SIZES.sm, fontWeight: 500, fontFamily: FONTS.sans,
      transition: 'all 0.2s',
    },
  }, label);
}

function Tabs({ tabs, active, onChange, style: sx }) {
  const { theme } = useTheme();
  const c = COLORS[theme];
  return React.createElement('div', {
    style: {
      display: 'flex', gap: '4px', padding: '4px', background: c.surfaceAlt,
      borderRadius: RADIUS.md, overflow: 'auto', ...sx,
    },
  }, tabs.map((tab, i) => React.createElement('button', {
    key: tab.key || i,
    onClick: () => onChange(tab.key || tab),
    style: {
      padding: '8px 16px', borderRadius: RADIUS.sm, cursor: 'pointer', border: 'none',
      fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, fontWeight: 600, whiteSpace: 'nowrap',
      background: (tab.key || tab) === active ? COLORS.primary[500] : 'transparent',
      color: (tab.key || tab) === active ? '#fff' : c.textSecondary,
      transition: 'all 0.2s',
    },
  }, tab.label || tab)));
}

function Spinner({ size = 24, color }) {
  return React.createElement('div', {
    style: {
      width: size, height: size, border: `2.5px solid ${color || COLORS.primary[500]}30`,
      borderTopColor: color || COLORS.primary[500], borderRadius: '50%',
      animation: 'nc-spin 0.8s linear infinite',
    },
  });
}

function EmptyState({ icon, title, description, action }) {
  const { theme } = useTheme();
  const c = COLORS[theme];
  return React.createElement('div', {
    style: { textAlign: 'center', padding: SPACING['2xl'], animation: 'nc-fadeIn 0.5s ease' },
  },
    icon && React.createElement('div', { style: { marginBottom: SPACING.md, color: c.textMuted, display: 'flex', justifyContent: 'center' } }, icon),
    React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text, marginBottom: '8px' } }, title),
    description && React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.base, marginBottom: SPACING.lg, maxWidth: '400px', margin: '0 auto 24px' } }, description),
    action,
  );
}

function ProgressBar({ value, max = 100, height = 8, color, style: sx }) {
  const { theme } = useTheme();
  const c = COLORS[theme];
  const pct = Math.min((value / max) * 100, 100);
  return React.createElement('div', {
    style: { width: '100%', height, background: `${c.textMuted}20`, borderRadius: RADIUS.full, overflow: 'hidden', ...sx },
  },
    React.createElement('div', {
      style: {
        width: `${pct}%`, height: '100%', borderRadius: RADIUS.full,
        background: color || COLORS.gradientPrimary, transition: 'width 0.5s ease',
      },
    }),
  );
}

function StatCard({ icon, label, value, change, trend, style: sx }) {
  const { theme } = useTheme();
  const c = COLORS[theme];
  const isPositive = trend === 'up';
  return React.createElement(Card, { style: { ...sx } },
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' } },
      React.createElement('div', {
        style: {
          width: 44, height: 44, borderRadius: RADIUS.md, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: COLORS.gradientCard,
        },
      }, icon),
      change != null && React.createElement('span', {
        style: {
          fontSize: FONT_SIZES.xs, fontWeight: 600, padding: '3px 8px', borderRadius: RADIUS.full,
          color: isPositive ? COLORS.success : COLORS.error,
          background: isPositive ? `${COLORS.success}15` : `${COLORS.error}15`,
        },
      }, `${isPositive ? '+' : ''}${change}%`),
    ),
    React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary, marginBottom: '4px' } }, label),
    React.createElement('p', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text } }, value),
  );
}

function Toggle({ checked, onChange, label }) {
  const { theme } = useTheme();
  const c = COLORS[theme];
  return React.createElement('label', {
    style: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  },
    React.createElement('div', {
      onClick: () => onChange(!checked),
      style: {
        width: 44, height: 24, borderRadius: RADIUS.full, padding: '2px',
        background: checked ? COLORS.primary[500] : c.textMuted + '40',
        transition: 'background 0.2s', cursor: 'pointer',
      },
    },
      React.createElement('div', {
        style: {
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        },
      }),
    ),
    label && React.createElement('span', { style: { fontSize: FONT_SIZES.sm, color: c.text, fontWeight: 500 } }, label),
  );
}

function Tooltip2({ children, text }) {
  const [show, setShow] = useState(false);
  const { theme } = useTheme();
  const c = COLORS[theme];
  return React.createElement('div', {
    style: { position: 'relative', display: 'inline-flex' },
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false),
  },
    children,
    show && React.createElement('div', {
      style: {
        position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
        padding: '6px 12px', borderRadius: RADIUS.sm, background: c.text, color: c.bg,
        fontSize: FONT_SIZES.xs, fontWeight: 500, whiteSpace: 'nowrap', marginBottom: '6px',
        animation: 'nc-fadeIn 0.15s ease', zIndex: 100, pointerEvents: 'none',
      },
    }, text),
  );
}

function Divider({ style: sx }) {
  const { theme } = useTheme();
  return React.createElement('hr', {
    style: { border: 'none', height: '1px', background: COLORS[theme].border, margin: '16px 0', ...sx },
  });
}

// ── Toast System ──
const ToastContext = createContext({ toasts: [], addToast: () => {} });
function useToast() { return useContext(ToastContext); }

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);
  return React.createElement(ToastContext.Provider, { value: { toasts, addToast } },
    children,
    React.createElement(ToastContainer, { toasts }),
  );
}

function ToastContainer({ toasts }) {
  const { theme } = useTheme();
  const c = COLORS[theme];
  if (!toasts.length) return null;
  const icons = { success: Icons.checkCircle, error: Icons.alertCircle, info: Icons.alertCircle, warning: Icons.alertCircle };
  const colors = { success: COLORS.success, error: COLORS.error, info: COLORS.info, warning: COLORS.warning };
  return React.createElement('div', {
    style: { position: 'fixed', top: '20px', right: '20px', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '8px' },
  }, toasts.map(t => React.createElement('div', {
    key: t.id,
    style: {
      ...glassStyle(theme), padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px',
      background: c.surface, borderLeft: `3px solid ${colors[t.type] || COLORS.info}`,
      minWidth: '280px', animation: 'nc-fadeInRight 0.3s ease', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    },
  },
    React.createElement('span', { style: { color: colors[t.type], display: 'flex' } }, (icons[t.type] || icons.info)(18)),
    React.createElement('span', { style: { color: c.text, fontSize: FONT_SIZES.sm, fontWeight: 500 } }, t.msg),
  )));
}


/* ═══════════════════════════════════════════════════════════════
   Phase 2: Data Layer
   ═══════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { id: 'daily-living', name: 'Daily Living Support', icon: '\u{1F3E0}', desc: 'Help with everyday tasks and personal care' },
  { id: 'therapy', name: 'Therapy Services', icon: '\u{1F9E0}', desc: 'OT, speech pathology, psychology' },
  { id: 'physiotherapy', name: 'Physiotherapy', icon: '\u{1F4AA}', desc: 'Physical rehabilitation and mobility' },
  { id: 'community', name: 'Community Participation', icon: '\u{1F91D}', desc: 'Social activities and community access' },
  { id: 'transport', name: 'Transport', icon: '\u{1F697}', desc: 'Getting to appointments and activities' },
  { id: 'plan-management', name: 'Plan Management', icon: '\u{1F4CB}', desc: 'Financial management of NDIS plan' },
  { id: 'support-coordination', name: 'Support Coordination', icon: '\u{1F517}', desc: 'Connecting with right supports' },
  { id: 'accommodation', name: 'Supported Accommodation', icon: '\u{1F3E1}', desc: 'SIL, SDA, supported living' },
  { id: 'employment', name: 'Employment Support', icon: '\u{1F4BC}', desc: 'Job seeking and workplace support' },
  { id: 'assistive-tech', name: 'Assistive Technology', icon: '\u{2699}\u{FE0F}', desc: 'Equipment, devices, home mods' },
  { id: 'behaviour', name: 'Behaviour Support', icon: '\u{1F4CA}', desc: 'Positive behaviour support plans' },
  { id: 'nursing', name: 'Nursing Care', icon: '\u{1F3E5}', desc: 'Clinical nursing and health support' },
  { id: 'early-intervention', name: 'Early Intervention', icon: '\u{1F9D2}', desc: 'Therapy for children with disability' },
  { id: 'respite', name: 'Respite Care', icon: '\u{1F33F}', desc: 'Short-term break for carers' },
  { id: 'meal-prep', name: 'Meal Preparation', icon: '\u{1F37D}\u{FE0F}', desc: 'Meal planning, cooking, nutrition' },
];

const SUBURBS = ['Newcastle','Maitland','Cessnock','Raymond Terrace','Lake Macquarie','Charlestown','Belmont','Warners Bay','Toronto','Gosford','Wyong','Tuggerah','The Entrance','Muswellbrook','Singleton','Nelson Bay','Kurri Kurri','Morisset','Swansea','Merewether'];

const PROVIDERS_DATA = [
  { id:'p1',name:'Sunshine Support Services',email:'sunshine@provider.com.au',password:'password',tier:'premium',verified:true,
    workerScreeningStatus:'verified',workerScreeningNumber:'WSC-2024-001234',workerScreeningExpiry:'2026-08-15',
    categories:['daily-living','community','respite'],suburb:'Newcastle',state:'NSW',postcode:'2300',phone:'02 4976 5432',website:'www.sunshinesupport.com.au',
    description:'Sunshine Support Services has been providing exceptional disability support across the Hunter Region for over 12 years. Our team of 50+ qualified support workers deliver person-centred care.',
    shortDescription:'Premier disability support across the Hunter Region with 12+ years experience.',
    photos:['Team event','Modern office','Park activity','Group session'],
    rating:4.8,reviewCount:47,responseRate:98,responseTime:'< 2 hours',waitTime:'1-2 weeks',
    planTypes:['Agency','Plan Managed','Self Managed'],
    availability:{mon:'7am-7pm',tue:'7am-7pm',wed:'7am-7pm',thu:'7am-7pm',fri:'7am-7pm',sat:'8am-4pm',sun:'8am-2pm'},
    serviceAreas:['Newcastle','Maitland','Lake Macquarie','Charlestown','Raymond Terrace'],
    founded:2012,teamSize:'50+',languages:['English','Arabic','Mandarin','Vietnamese'],
    features:['24/7 on-call','Female/male workers','Cultural matching','Transport available'],
    viewsThisMonth:342,enquiriesThisMonth:28,bookingsThisMonth:15 },
  { id:'p2',name:'PhysioPlus Disability',email:'physio@provider.com.au',password:'password',tier:'professional',verified:true,
    workerScreeningStatus:'verified',workerScreeningNumber:'WSC-2024-002456',workerScreeningExpiry:'2026-11-30',
    categories:['physiotherapy','therapy','early-intervention'],suburb:'Maitland',state:'NSW',postcode:'2320',phone:'02 4933 4321',website:'www.physioplusdisability.com.au',
    description:'PhysioPlus provides specialised physiotherapy and therapy services with state-of-the-art equipment including hydrotherapy pool and adaptive gym.',
    shortDescription:'Specialised physiotherapy with hydrotherapy pool and adaptive gym.',
    photos:['Hydrotherapy pool','Adaptive gym','Therapy room'],
    rating:4.9,reviewCount:63,responseRate:95,responseTime:'< 4 hours',waitTime:'2-3 weeks',
    planTypes:['Agency','Plan Managed','Self Managed'],
    availability:{mon:'8am-6pm',tue:'8am-6pm',wed:'8am-8pm',thu:'8am-6pm',fri:'8am-5pm',sat:'9am-1pm',sun:'Closed'},
    serviceAreas:['Maitland','Cessnock','Kurri Kurri','Raymond Terrace','Singleton'],
    founded:2016,teamSize:'20+',languages:['English','Korean','Cantonese'],
    features:['Hydrotherapy','Home visits','Telehealth','Group sessions'],
    viewsThisMonth:256,enquiriesThisMonth:18,bookingsThisMonth:12 },
  { id:'p3',name:'CareFirst Plan Management',email:'carefirst@provider.com.au',password:'password',tier:'professional',verified:true,
    workerScreeningStatus:'verified',workerScreeningNumber:'WSC-2024-003789',workerScreeningExpiry:'2027-03-20',
    categories:['plan-management'],suburb:'Cessnock',state:'NSW',postcode:'2325',phone:'02 4990 3210',website:'www.carefirstpm.com.au',
    description:'CareFirst takes the stress out of managing your NDIS funds with 48-hour invoice processing and real-time budget tracking.',
    shortDescription:'Fast invoice processing with real-time budget tracking.',
    photos:['Team in office','App screenshot'],
    rating:4.7,reviewCount:89,responseRate:99,responseTime:'< 1 hour',waitTime:'Immediate',
    planTypes:['Plan Managed'],
    availability:{mon:'9am-5pm',tue:'9am-5pm',wed:'9am-5pm',thu:'9am-5pm',fri:'9am-5pm',sat:'Closed',sun:'Closed'},
    serviceAreas:['Hunter Region','Central Coast','Newcastle'],
    founded:2018,teamSize:'15',languages:['English','Hindi','Punjabi'],
    features:['48hr processing','Real-time tracking','Monthly reports','Dedicated manager'],
    viewsThisMonth:189,enquiriesThisMonth:22,bookingsThisMonth:18 },
  { id:'p4',name:'Accessible Living Solutions',email:'als@provider.com.au',password:'password',tier:'premium',verified:true,
    workerScreeningStatus:'pending',workerScreeningNumber:'',workerScreeningExpiry:'',
    categories:['accommodation','assistive-tech','daily-living'],suburb:'Raymond Terrace',state:'NSW',postcode:'2324',phone:'02 4987 2109',website:'www.accessibleliving.com.au',
    description:'Comprehensive supported accommodation and assistive technology. We operate 8 SIL houses across the Hunter Region.',
    shortDescription:'SIL accommodation and AT specialists in the Hunter.',
    photos:['SIL house','Accessible kitchen','AT showroom','Garden'],
    rating:4.6,reviewCount:34,responseRate:92,responseTime:'< 6 hours',waitTime:'4-6 weeks',
    planTypes:['Agency','Plan Managed'],
    availability:{mon:'24/7',tue:'24/7',wed:'24/7',thu:'24/7',fri:'24/7',sat:'24/7',sun:'24/7'},
    serviceAreas:['Raymond Terrace','Maitland','Newcastle','Nelson Bay','Cessnock'],
    founded:2014,teamSize:'80+',languages:['English','Arabic','Turkish','Greek'],
    features:['24/7 support','SDA properties','AT assessments','Home modifications'],
    viewsThisMonth:198,enquiriesThisMonth:14,bookingsThisMonth:6 },
  { id:'p5',name:'MindBridge Psychology',email:'mindbridge@provider.com.au',password:'password',tier:'premium',verified:true,
    workerScreeningStatus:'verified',workerScreeningNumber:'WSC-2024-005321',workerScreeningExpiry:'2026-06-30',
    categories:['therapy','behaviour','early-intervention'],suburb:'Lake Macquarie',state:'NSW',postcode:'2283',phone:'02 4950 1098',website:'www.mindbridgepsych.com.au',
    description:'Clinical psychology, behaviour support, and early intervention specialising in autism, intellectual disability, and complex needs.',
    shortDescription:'Clinical psychology and behaviour support for complex needs.',
    photos:['Therapy room','Sensory space','Waiting area'],
    rating:4.9,reviewCount:52,responseRate:97,responseTime:'< 3 hours',waitTime:'3-4 weeks',
    planTypes:['Agency','Plan Managed','Self Managed'],
    availability:{mon:'9am-7pm',tue:'9am-7pm',wed:'9am-7pm',thu:'9am-7pm',fri:'9am-5pm',sat:'10am-2pm',sun:'Closed'},
    serviceAreas:['Lake Macquarie','Charlestown','Toronto','Belmont','Swansea'],
    founded:2017,teamSize:'12',languages:['English','Mandarin'],
    features:['Telehealth','School visits','PBS plans','Group therapy'],
    viewsThisMonth:289,enquiriesThisMonth:31,bookingsThisMonth:20 },
  { id:'p6',name:'ConnectAbility Support Coordination',email:'connectability@provider.com.au',password:'password',tier:'professional',verified:false,
    workerScreeningStatus:'not_submitted',workerScreeningNumber:'',workerScreeningExpiry:'',
    categories:['support-coordination'],suburb:'Charlestown',state:'NSW',postcode:'2290',phone:'02 4943 0987',website:'www.connectability.com.au',
    description:'Helping participants navigate the NDIS system. Specialising in complex support needs and psychosocial disability.',
    shortDescription:'Expert support coordination for complex needs.',
    photos:['Team meeting','Community outing'],
    rating:4.5,reviewCount:28,responseRate:94,responseTime:'< 4 hours',waitTime:'1-2 weeks',
    planTypes:['Agency','Plan Managed','Self Managed'],
    availability:{mon:'9am-5pm',tue:'9am-5pm',wed:'9am-5pm',thu:'9am-5pm',fri:'9am-4pm',sat:'Closed',sun:'Closed'},
    serviceAreas:['Charlestown','Lake Macquarie','Newcastle','Belmont'],
    founded:2019,teamSize:'8',languages:['English','Greek','Mandarin'],
    features:['Specialist SC','Crisis support','Provider network','Plan reviews'],
    viewsThisMonth:134,enquiriesThisMonth:11,bookingsThisMonth:8 },
  { id:'p7',name:'DriveAbility Transport',email:'driveability@provider.com.au',password:'password',tier:'professional',verified:true,
    workerScreeningStatus:'verified',workerScreeningNumber:'WSC-2024-007654',workerScreeningExpiry:'2027-01-10',
    categories:['transport','community'],suburb:'Belmont',state:'NSW',postcode:'2280',phone:'02 4945 9876',website:'www.driveability.com.au',
    description:'Reliable wheelchair-accessible transport with modified vehicles featuring hoists and ramps.',
    shortDescription:'Wheelchair-accessible transport with trained drivers.',
    photos:['Accessible van','Driver assisting'],
    rating:4.4,reviewCount:41,responseRate:90,responseTime:'< 2 hours',waitTime:'3-5 days',
    planTypes:['Agency','Plan Managed','Self Managed'],
    availability:{mon:'6am-8pm',tue:'6am-8pm',wed:'6am-8pm',thu:'6am-8pm',fri:'6am-8pm',sat:'7am-5pm',sun:'8am-4pm'},
    serviceAreas:['Hunter Region','Central Coast'],
    founded:2015,teamSize:'25',languages:['English','Arabic','Bengali'],
    features:['Wheelchair accessible','Group transport','Medical transport','Weekend service'],
    viewsThisMonth:156,enquiriesThisMonth:15,bookingsThisMonth:22 },
  { id:'p8',name:'WorkBridge Employment',email:'workbridge@provider.com.au',password:'password',tier:'professional',verified:false,
    workerScreeningStatus:'pending',workerScreeningNumber:'',workerScreeningExpiry:'',
    categories:['employment','community'],suburb:'Warners Bay',state:'NSW',postcode:'2282',phone:'02 4948 8765',website:'www.workbridge.com.au',
    description:'Supporting participants in finding and maintaining meaningful employment with comprehensive job support.',
    shortDescription:'Employment support from resume to retention.',
    photos:['Workshop','Workplace support'],
    rating:4.3,reviewCount:19,responseRate:88,responseTime:'< 8 hours',waitTime:'1-2 weeks',
    planTypes:['Agency','Plan Managed'],
    availability:{mon:'9am-5pm',tue:'9am-5pm',wed:'9am-5pm',thu:'9am-5pm',fri:'9am-4pm',sat:'Closed',sun:'Closed'},
    serviceAreas:['Warners Bay','Lake Macquarie','Charlestown','Toronto'],
    founded:2020,teamSize:'10',languages:['English','Vietnamese','Arabic'],
    features:['Resume writing','Mock interviews','Job matching','In-work support'],
    viewsThisMonth:87,enquiriesThisMonth:8,bookingsThisMonth:4 },
  { id:'p9',name:'NurtureCare Nursing',email:'nurturecare@provider.com.au',password:'password',tier:'professional',verified:true,
    workerScreeningStatus:'verified',workerScreeningNumber:'WSC-2024-009876',workerScreeningExpiry:'2026-09-25',
    categories:['nursing','daily-living'],suburb:'Toronto',state:'NSW',postcode:'2283',phone:'02 4959 7654',website:'www.nurturecare.com.au',
    description:'Registered nursing for complex health needs including medication management, wound care, and health monitoring.',
    shortDescription:'Registered nursing for complex health needs.',
    photos:['Nurse with participant','Clinical supplies'],
    rating:4.7,reviewCount:22,responseRate:96,responseTime:'< 3 hours',waitTime:'1-2 weeks',
    planTypes:['Agency','Plan Managed'],
    availability:{mon:'24/7',tue:'24/7',wed:'24/7',thu:'24/7',fri:'24/7',sat:'24/7',sun:'24/7'},
    serviceAreas:['Toronto','Lake Macquarie','Morisset','Swansea'],
    founded:2017,teamSize:'30',languages:['English','Filipino','Hindi'],
    features:['24/7 nursing','Complex care','Medication management','Telehealth'],
    viewsThisMonth:112,enquiriesThisMonth:9,bookingsThisMonth:7 },
  { id:'p10',name:'Little Stars Early Intervention',email:'littlestars@provider.com.au',password:'password',tier:'premium',verified:true,
    workerScreeningStatus:'verified',workerScreeningNumber:'WSC-2024-010543',workerScreeningExpiry:'2027-02-28',
    categories:['early-intervention','therapy','behaviour'],suburb:'Gosford',state:'NSW',postcode:'2250',phone:'02 4325 6543',website:'www.littlestars.com.au',
    description:'Multidisciplinary early intervention for children 0-12 with speech pathologists, OTs, psychologists, and behaviour practitioners.',
    shortDescription:'Multidisciplinary early intervention for children 0-12.',
    photos:['Play therapy','Sensory room','Outdoor play','Parent workshop'],
    rating:4.8,reviewCount:56,responseRate:97,responseTime:'< 2 hours',waitTime:'2-4 weeks',
    planTypes:['Agency','Plan Managed','Self Managed'],
    availability:{mon:'8am-6pm',tue:'8am-6pm',wed:'8am-6pm',thu:'8am-6pm',fri:'8am-4pm',sat:'9am-12pm',sun:'Closed'},
    serviceAreas:['Gosford','Wyong','Tuggerah','The Entrance','Morisset'],
    founded:2015,teamSize:'18',languages:['English','Mandarin','Korean'],
    features:['Multidisciplinary','School visits','Parent training','Group programs'],
    viewsThisMonth:267,enquiriesThisMonth:25,bookingsThisMonth:16 },
  { id:'p11',name:'MealMate Kitchen',email:'mealmate@provider.com.au',password:'password',tier:'starter',verified:false,
    categories:['meal-prep','daily-living'],suburb:'Wyong',state:'NSW',postcode:'2259',phone:'02 4353 2222',website:'',
    description:'Meal planning, grocery shopping, and cooking skills support based on dietary needs.',
    shortDescription:'Meal prep and cooking support.',photos:[],
    rating:4.2,reviewCount:8,responseRate:80,responseTime:'1-2 days',waitTime:'1 week',
    planTypes:['Plan Managed','Self Managed'],
    availability:{mon:'9am-3pm',tue:'9am-3pm',wed:'9am-3pm',thu:'9am-3pm',fri:'9am-1pm',sat:'Closed',sun:'Closed'},
    serviceAreas:['Wyong','Tuggerah','The Entrance'],founded:2021,teamSize:'5',languages:['English'],
    features:['Dietary plans','Cooking skills'],viewsThisMonth:45,enquiriesThisMonth:3,bookingsThisMonth:2 },
  { id:'p12',name:'Happy Days Community',email:'happydays@provider.com.au',password:'password',tier:'starter',verified:false,
    categories:['community','respite'],suburb:'Tuggerah',state:'NSW',postcode:'2259',phone:'02 4353 3333',website:'',
    description:'Fun community group activities and weekend respite for adults with disability.',
    shortDescription:'Fun community activities and weekend respite.',photos:[],
    rating:4.0,reviewCount:12,responseRate:75,responseTime:'2-3 days',waitTime:'1-2 weeks',
    planTypes:['Agency','Plan Managed'],
    availability:{mon:'10am-4pm',tue:'Closed',wed:'10am-4pm',thu:'Closed',fri:'10am-4pm',sat:'9am-4pm',sun:'Closed'},
    serviceAreas:['Tuggerah','Wyong','Gosford'],founded:2022,teamSize:'4',languages:['English'],
    features:['Group activities','Weekend programs'],viewsThisMonth:34,enquiriesThisMonth:2,bookingsThisMonth:1 },
  { id:'p13',name:'SafeHands Daily',email:'safehands@provider.com.au',password:'password',tier:'starter',verified:false,
    categories:['daily-living'],suburb:'The Entrance',state:'NSW',postcode:'2261',phone:'02 4332 4444',website:'',
    description:'Personal care and daily living support on the Central Coast.',
    shortDescription:'Personal care on the Central Coast.',photos:[],
    rating:4.1,reviewCount:6,responseRate:82,responseTime:'1-2 days',waitTime:'1-2 weeks',
    planTypes:['Agency','Plan Managed'],
    availability:{mon:'7am-5pm',tue:'7am-5pm',wed:'7am-5pm',thu:'7am-5pm',fri:'7am-3pm',sat:'Closed',sun:'Closed'},
    serviceAreas:['The Entrance','Tuggerah','Gosford'],founded:2023,teamSize:'3',languages:['English'],
    features:['Personal care','Domestic help'],viewsThisMonth:28,enquiriesThisMonth:2,bookingsThisMonth:1 },
  { id:'p14',name:'GreenThumb Garden Therapy',email:'greenthumb@provider.com.au',password:'password',tier:'starter',verified:false,
    categories:['community','therapy'],suburb:'Muswellbrook',state:'NSW',postcode:'2333',phone:'02 6543 5555',website:'',
    description:'Therapeutic gardening and horticulture programs.',
    shortDescription:'Therapeutic gardening programs.',photos:[],
    rating:4.5,reviewCount:10,responseRate:70,responseTime:'2-3 days',waitTime:'2 weeks',
    planTypes:['Plan Managed','Self Managed'],
    availability:{mon:'9am-2pm',tue:'9am-2pm',wed:'Closed',thu:'9am-2pm',fri:'9am-2pm',sat:'Closed',sun:'Closed'},
    serviceAreas:['Muswellbrook','Singleton','Cessnock'],founded:2022,teamSize:'3',languages:['English','Korean'],
    features:['Garden therapy','Group programs'],viewsThisMonth:42,enquiriesThisMonth:3,bookingsThisMonth:2 },
  { id:'p15',name:'TechAssist AT Solutions',email:'techassist@provider.com.au',password:'password',tier:'professional',verified:true,
    categories:['assistive-tech'],suburb:'Singleton',state:'NSW',postcode:'2330',phone:'02 6571 6666',website:'www.techassist.com.au',
    description:'Assistive technology assessments, supply, and training from communication devices to smart home systems.',
    shortDescription:'AT assessments, supply and training.',
    photos:['AT showroom','Smart home demo'],
    rating:4.6,reviewCount:31,responseRate:91,responseTime:'< 6 hours',waitTime:'2-3 weeks',
    planTypes:['Agency','Plan Managed','Self Managed'],
    availability:{mon:'9am-5pm',tue:'9am-5pm',wed:'9am-5pm',thu:'9am-5pm',fri:'9am-4pm',sat:'By appt',sun:'Closed'},
    serviceAreas:['Hunter Region','Central Coast'],founded:2018,teamSize:'12',languages:['English','Arabic'],
    features:['AT trials','Home assessments','Training','Repairs'],viewsThisMonth:98,enquiriesThisMonth:10,bookingsThisMonth:6 },
  { id:'p16',name:'Harmony SIL Homes',email:'harmony@provider.com.au',password:'password',tier:'premium',verified:true,
    categories:['accommodation','daily-living'],suburb:'Nelson Bay',state:'NSW',postcode:'2315',phone:'02 4984 7777',website:'www.harmonysil.com.au',
    description:'12 SIL and SDA homes across the Hunter Region with 24/7 support in modern purpose-built properties.',
    shortDescription:'12 modern SIL/SDA homes with 24/7 support.',
    photos:['SDA property','Accessible bathroom','Living room','Garden'],
    rating:4.7,reviewCount:38,responseRate:93,responseTime:'< 4 hours',waitTime:'6-8 weeks',
    planTypes:['Agency'],
    availability:{mon:'24/7',tue:'24/7',wed:'24/7',thu:'24/7',fri:'24/7',sat:'24/7',sun:'24/7'},
    serviceAreas:['Nelson Bay','Raymond Terrace','Newcastle','Maitland'],founded:2016,teamSize:'95',languages:['English','Samoan','Tongan','Arabic'],
    features:['SDA certified','24/7 nursing','Sensory gardens','Community bus'],viewsThisMonth:176,enquiriesThisMonth:12,bookingsThisMonth:3 },
  { id:'p17',name:'SpeakEasy Speech Pathology',email:'speakeasy@provider.com.au',password:'password',tier:'professional',verified:true,
    categories:['therapy','early-intervention'],suburb:'Kurri Kurri',state:'NSW',postcode:'2327',phone:'02 4937 8888',website:'www.speakeasysp.com.au',
    description:'Speech pathology for communication difficulties, swallowing disorders, and language delays.',
    shortDescription:'Speech pathology for communication and language.',
    photos:['Therapy session','AAC devices'],
    rating:4.8,reviewCount:44,responseRate:96,responseTime:'< 3 hours',waitTime:'3-4 weeks',
    planTypes:['Agency','Plan Managed','Self Managed'],
    availability:{mon:'8am-6pm',tue:'8am-6pm',wed:'8am-6pm',thu:'8am-6pm',fri:'8am-4pm',sat:'9am-12pm',sun:'Closed'},
    serviceAreas:['Kurri Kurri','Cessnock','Maitland','Singleton'],founded:2019,teamSize:'8',languages:['English'],
    features:['AAC specialist','Mealtime management','Social skills','Telehealth'],viewsThisMonth:145,enquiriesThisMonth:16,bookingsThisMonth:10 },
  { id:'p18',name:'FreshStart Respite',email:'freshstart@provider.com.au',password:'password',tier:'starter',verified:false,
    categories:['respite'],suburb:'Morisset',state:'NSW',postcode:'2264',phone:'02 4973 9999',website:'',
    description:'In-home and centre-based respite care so carers can recharge.',
    shortDescription:'In-home and centre-based respite.',photos:[],
    rating:4.0,reviewCount:5,responseRate:78,responseTime:'1-2 days',waitTime:'2-3 weeks',
    planTypes:['Agency','Plan Managed'],
    availability:{mon:'8am-6pm',tue:'8am-6pm',wed:'8am-6pm',thu:'8am-6pm',fri:'8am-4pm',sat:'9am-3pm',sun:'Closed'},
    serviceAreas:['Morisset','Toronto','Lake Macquarie'],founded:2023,teamSize:'6',languages:['English'],
    features:['In-home respite','Centre-based','Overnight'],viewsThisMonth:22,enquiriesThisMonth:1,bookingsThisMonth:1 },
  { id:'p19',name:'Basic Care Provider',email:'basic@provider.com.au',password:'password',tier:'starter',verified:false,
    categories:['daily-living','transport'],suburb:'Swansea',state:'NSW',postcode:'2281',phone:'02 4971 0000',website:'',
    description:'Daily living support and transport in the Swansea area.',
    shortDescription:'Daily living and transport in Swansea.',photos:[],
    rating:3.8,reviewCount:4,responseRate:72,responseTime:'2-3 days',waitTime:'1-2 weeks',
    planTypes:['Plan Managed'],
    availability:{mon:'8am-4pm',tue:'8am-4pm',wed:'8am-4pm',thu:'8am-4pm',fri:'8am-2pm',sat:'Closed',sun:'Closed'},
    serviceAreas:['Swansea','Belmont','Lake Macquarie'],founded:2024,teamSize:'2',languages:['English'],
    features:['Personal care','Transport'],viewsThisMonth:15,enquiriesThisMonth:1,bookingsThisMonth:0 },
  { id:'p20',name:'Pathways OT',email:'pathways@provider.com.au',password:'password',tier:'professional',verified:true,
    categories:['therapy','assistive-tech','daily-living'],suburb:'Merewether',state:'NSW',postcode:'2291',phone:'02 4963 1111',website:'www.pathwaysot.com.au',
    description:'Occupational therapy for maximising independence through functional assessments, home mods, and sensory support.',
    shortDescription:'OT for independence and home mods.',
    photos:['OT session','Home mod assessment'],
    rating:4.6,reviewCount:27,responseRate:93,responseTime:'< 4 hours',waitTime:'2-3 weeks',
    planTypes:['Agency','Plan Managed','Self Managed'],
    availability:{mon:'8am-5pm',tue:'8am-5pm',wed:'8am-5pm',thu:'8am-5pm',fri:'8am-3pm',sat:'Closed',sun:'Closed'},
    serviceAreas:['Merewether','Newcastle','Charlestown','Lake Macquarie'],founded:2020,teamSize:'6',languages:['English','Italian'],
    features:['Home mods','Driver assessments','Sensory support','Functional assessments'],viewsThisMonth:88,enquiriesThisMonth:7,bookingsThisMonth:5 },
];

// ── Simulated Participants ──
const PARTICIPANTS_DATA = [
  { id:'u1',name:'Sarah Mitchell',email:'sarah@participant.com.au',password:'password',role:'participant',
    suburb:'Newcastle',state:'NSW',ndisNumber:'431 234 567',planType:'Plan Managed',
    goals:['Improve daily living skills','Join community activities','Find employment'],
    categories:['daily-living','community','employment'],favourites:['p1','p2','p5'] },
  { id:'u2',name:'James Chen',email:'james@participant.com.au',password:'password',role:'participant',
    suburb:'Maitland',state:'NSW',ndisNumber:'431 345 678',planType:'Self Managed',
    goals:['Physical rehabilitation','Assistive technology','Transport'],
    categories:['physiotherapy','assistive-tech','transport'],favourites:['p2','p15','p7'] },
  { id:'u3',name:'Amira Hassan',email:'amira@participant.com.au',password:'password',role:'participant',
    suburb:'Raymond Terrace',state:'NSW',ndisNumber:'431 456 789',planType:'Agency',
    goals:['Supported accommodation','Daily living assistance'],
    categories:['accommodation','daily-living','nursing'],favourites:['p4','p1','p16'] },
  { id:'u4',name:'Tom Williams',email:'tom@participant.com.au',password:'password',role:'participant',
    suburb:'Lake Macquarie',state:'NSW',ndisNumber:'431 567 890',planType:'Plan Managed',
    goals:['Psychology sessions','Behaviour support','Community access'],
    categories:['therapy','behaviour','community'],favourites:['p5','p6'] },
  { id:'u5',name:'Priya Sharma',email:'priya@participant.com.au',password:'password',role:'participant',
    suburb:'Gosford',state:'NSW',ndisNumber:'431 678 901',planType:'Plan Managed',
    goals:['Early intervention for son','Speech therapy','OT sessions'],
    categories:['early-intervention','therapy'],favourites:['p10','p17','p2'] },
  { id:'u6',name:'Michael Brown',email:'michael@participant.com.au',password:'password',role:'participant',
    suburb:'Warners Bay',state:'NSW',ndisNumber:'431 789 012',planType:'Self Managed',
    goals:['Find employment','Build work skills','Community participation'],
    categories:['employment','community'],favourites:['p8'] },
  { id:'u7',name:'Lucy Nguyen',email:'lucy@participant.com.au',password:'password',role:'participant',
    suburb:'Charlestown',state:'NSW',ndisNumber:'431 890 123',planType:'Plan Managed',
    goals:['Support coordination','Plan management'],
    categories:['support-coordination','plan-management'],favourites:['p6','p3'] },
  { id:'u8',name:'David Park',email:'david@participant.com.au',password:'password',role:'participant',
    suburb:'Toronto',state:'NSW',ndisNumber:'431 901 234',planType:'Agency',
    goals:['Nursing care','Daily living support'],
    categories:['nursing','daily-living'],favourites:['p9'] },
  { id:'u9',name:'Sophie Taylor',email:'sophie@participant.com.au',password:'password',role:'participant',
    suburb:'Tuggerah',state:'NSW',ndisNumber:'431 012 345',planType:'Plan Managed',
    goals:['Respite care','Community activities'],
    categories:['respite','community'],favourites:['p12','p18'] },
  { id:'u10',name:'Ryan O\'Brien',email:'ryan@participant.com.au',password:'password',role:'participant',
    suburb:'Nelson Bay',state:'NSW',ndisNumber:'431 123 456',planType:'Agency',
    goals:['Supported accommodation','Meal preparation'],
    categories:['accommodation','meal-prep','daily-living'],favourites:['p16','p11'] },
];

// ── Admin Account ──
const ADMIN_DATA = { id:'admin1',name:'Admin User',email:'admin@nexaconnect.com.au',password:'password',role:'admin' };

// ── Reviews Data ──
const REVIEWS_DATA = [
  { id:'r1',providerId:'p1',participantId:'u1',participantName:'Sarah M.',rating:5,date:'2025-12-15',
    text:'Sunshine Support has been incredible. My support worker Lisa is so patient and encouraging. I have gained so much confidence with daily tasks.',
    response:'Thank you Sarah! Lisa loves working with you. We are thrilled to see your progress!',responseDate:'2025-12-16' },
  { id:'r2',providerId:'p1',participantId:'u3',participantName:'Amira H.',rating:5,date:'2025-11-20',
    text:'The cultural matching service was exactly what I needed. Having a support worker who speaks Arabic has made such a difference.',
    response:'We are so glad the cultural matching worked well for you, Amira!',responseDate:'2025-11-21' },
  { id:'r3',providerId:'p1',participantId:'u10',participantName:'Ryan O.',rating:4,date:'2025-10-08',
    text:'Great service overall. Sometimes scheduling can be tricky but the team always finds a solution.',
    response:null,responseDate:null },
  { id:'r4',providerId:'p2',participantId:'u2',participantName:'James C.',rating:5,date:'2025-12-20',
    text:'The hydrotherapy sessions have been life-changing. My mobility has improved dramatically in just 3 months.',
    response:'James, your dedication to therapy is inspiring. Keep up the amazing work!',responseDate:'2025-12-21' },
  { id:'r5',providerId:'p2',participantId:'u5',participantName:'Priya S.',rating:5,date:'2025-11-15',
    text:'My son loves coming here. The therapists make every session fun while working on his goals.',
    response:'We love having your son here! His progress has been wonderful to witness.',responseDate:'2025-11-16' },
  { id:'r6',providerId:'p2',participantId:'u1',participantName:'Sarah M.',rating:5,date:'2025-09-30',
    text:'Professional, friendly, and effective. The adaptive gym is fantastic.',response:null,responseDate:null },
  { id:'r7',providerId:'p3',participantId:'u7',participantName:'Lucy N.',rating:5,date:'2025-12-10',
    text:'CareFirst makes plan management so easy. The app is brilliant and invoices are processed super fast.',
    response:'Thanks Lucy! We are always working to make things easier for our participants.',responseDate:'2025-12-11' },
  { id:'r8',providerId:'p3',participantId:'u1',participantName:'Sarah M.',rating:4,date:'2025-11-05',
    text:'Very reliable plan management. Monthly reports are detailed and helpful.',response:null,responseDate:null },
  { id:'r9',providerId:'p4',participantId:'u3',participantName:'Amira H.',rating:5,date:'2025-12-01',
    text:'The SIL house is wonderful. Staff are caring and the house feels like a real home.',
    response:'Thank you Amira! We strive to make every house feel like home.',responseDate:'2025-12-02' },
  { id:'r10',providerId:'p4',participantId:'u10',participantName:'Ryan O.',rating:4,date:'2025-10-20',
    text:'Good accommodation options. The AT assessment was thorough and helpful.',response:null,responseDate:null },
  { id:'r11',providerId:'p5',participantId:'u4',participantName:'Tom W.',rating:5,date:'2025-12-18',
    text:'Dr. Chen is exceptional. My anxiety has reduced significantly since starting CBT sessions.',
    response:'Thank you Tom. Your commitment to therapy is making all the difference.',responseDate:'2025-12-19' },
  { id:'r12',providerId:'p5',participantId:'u5',participantName:'Priya S.',rating:5,date:'2025-11-25',
    text:'The early intervention team is amazing. My son has made incredible progress.',response:null,responseDate:null },
  { id:'r13',providerId:'p5',participantId:'u1',participantName:'Sarah M.',rating:4,date:'2025-09-15',
    text:'Great psychologists. Wait time was a bit long but worth it.',response:null,responseDate:null },
  { id:'r14',providerId:'p6',participantId:'u7',participantName:'Lucy N.',rating:4,date:'2025-12-05',
    text:'ConnectAbility helped me find great providers. My coordinator is very knowledgeable.',
    response:'Thanks Lucy! We are glad we could help you find the right supports.',responseDate:'2025-12-06' },
  { id:'r15',providerId:'p7',participantId:'u2',participantName:'James C.',rating:4,date:'2025-11-30',
    text:'Reliable transport. Drivers are always friendly and the vehicles are well-maintained.',response:null,responseDate:null },
  { id:'r16',providerId:'p7',participantId:'u1',participantName:'Sarah M.',rating:5,date:'2025-10-15',
    text:'DriveAbility has never let me down. Always on time and the drivers are lovely.',
    response:'Thank you Sarah! Reliability is our top priority.',responseDate:'2025-10-16' },
  { id:'r17',providerId:'p8',participantId:'u6',participantName:'Michael B.',rating:4,date:'2025-12-12',
    text:'WorkBridge helped me get my first job in 5 years. The ongoing support makes a huge difference.',
    response:'Michael, we are so proud of you! Keep crushing it at work!',responseDate:'2025-12-13' },
  { id:'r18',providerId:'p9',participantId:'u8',participantName:'David P.',rating:5,date:'2025-12-08',
    text:'The nursing team is outstanding. They are compassionate and highly skilled.',
    response:'Thank you David. Your trust in our team means the world to us.',responseDate:'2025-12-09' },
  { id:'r19',providerId:'p10',participantId:'u5',participantName:'Priya S.',rating:5,date:'2025-12-22',
    text:'Little Stars has been a game-changer for our family. The multidisciplinary approach works brilliantly.',
    response:'Priya, watching your son thrive brings us so much joy. Thank you!',responseDate:'2025-12-23' },
  { id:'r20',providerId:'p10',participantId:'u4',participantName:'Tom W.',rating:5,date:'2025-11-10',
    text:'Excellent early intervention services. The therapists are skilled and caring.',response:null,responseDate:null },
  { id:'r21',providerId:'p11',participantId:'u10',participantName:'Ryan O.',rating:4,date:'2025-11-28',
    text:'MealMate has helped me learn to cook healthy meals. Great service!',response:null,responseDate:null },
  { id:'r22',providerId:'p12',participantId:'u9',participantName:'Sophie T.',rating:4,date:'2025-12-03',
    text:'Fun activities every week. My favourite is the beach walks!',response:null,responseDate:null },
  { id:'r23',providerId:'p15',participantId:'u2',participantName:'James C.',rating:5,date:'2025-12-14',
    text:'TechAssist found the perfect wheelchair for me. The trial process was excellent.',
    response:'Glad we could find the right fit, James!',responseDate:'2025-12-15' },
  { id:'r24',providerId:'p16',participantId:'u10',participantName:'Ryan O.',rating:5,date:'2025-11-18',
    text:'Harmony SIL homes are beautiful. The staff feel like family.',
    response:'Ryan, you are part of our family! Thank you for the kind words.',responseDate:'2025-11-19' },
  { id:'r25',providerId:'p17',participantId:'u5',participantName:'Priya S.',rating:5,date:'2025-12-16',
    text:'SpeakEasy has been wonderful for my son speech. Highly recommend!',response:null,responseDate:null },
  { id:'r26',providerId:'p20',participantId:'u1',participantName:'Sarah M.',rating:4,date:'2025-12-20',
    text:'Pathways OT did a thorough home assessment. Very professional team.',response:null,responseDate:null },
  { id:'r27',providerId:'p1',participantId:'u9',participantName:'Sophie T.',rating:5,date:'2025-12-25',
    text:'The respite care service is excellent. I feel safe and well looked after.',response:null,responseDate:null },
  { id:'r28',providerId:'p2',participantId:'u4',participantName:'Tom W.',rating:4,date:'2025-12-01',
    text:'Good physio sessions. The group exercise class is fun and motivating.',response:null,responseDate:null },
  { id:'r29',providerId:'p3',participantId:'u2',participantName:'James C.',rating:5,date:'2025-11-22',
    text:'Super efficient plan management. The budget tracker is my favourite feature.',response:null,responseDate:null },
  { id:'r30',providerId:'p5',participantId:'u7',participantName:'Lucy N.',rating:5,date:'2025-12-28',
    text:'My psychologist at MindBridge really understands psychosocial disability. Feeling so much better.',response:null,responseDate:null },
  { id:'r31',providerId:'p7',participantId:'u3',participantName:'Amira H.',rating:4,date:'2025-12-19',
    text:'Great transport service. The wheelchair accessible van is very comfortable.',response:null,responseDate:null },
  { id:'r32',providerId:'p9',participantId:'u3',participantName:'Amira H.',rating:5,date:'2025-12-11',
    text:'Excellent nursing care. The team is responsive and professional.',response:null,responseDate:null },
  { id:'r33',providerId:'p10',participantId:'u1',participantName:'Sarah M.',rating:4,date:'2025-10-30',
    text:'Little Stars provides great therapy. The sensory room is amazing.',response:null,responseDate:null },
  { id:'r34',providerId:'p15',participantId:'u8',participantName:'David P.',rating:4,date:'2025-11-08',
    text:'Good assistive technology provider. Helped me set up smart home controls.',response:null,responseDate:null },
  { id:'r35',providerId:'p16',participantId:'u3',participantName:'Amira H.',rating:5,date:'2025-12-30',
    text:'The SDA property is modern and accessible. Staff are wonderful.',response:null,responseDate:null },
  { id:'r36',providerId:'p17',participantId:'u4',participantName:'Tom W.',rating:4,date:'2025-12-07',
    text:'Good speech pathology services. Telehealth option is very convenient.',response:null,responseDate:null },
];

// ── Enquiry Threads ──
const ENQUIRIES_DATA = [
  { id:'e1',providerId:'p1',participantId:'u1',participantName:'Sarah Mitchell',providerName:'Sunshine Support Services',
    subject:'Daily living support enquiry',status:'active',createdAt:'2025-12-10',
    messages:[
      {from:'participant',text:'Hi, I am looking for daily living support in Newcastle area, 3 days a week. Can you help?',date:'2025-12-10',time:'10:30 AM'},
      {from:'provider',text:'Hi Sarah! Absolutely, we have availability for daily living support. Could you tell me more about what tasks you need help with?',date:'2025-12-10',time:'11:45 AM'},
      {from:'participant',text:'Mainly help with meal preparation, light housekeeping, and getting to my weekly appointments.',date:'2025-12-10',time:'2:15 PM'},
      {from:'provider',text:'Perfect, we can definitely help with all of those. Shall we arrange a meet-and-greet with one of our support workers?',date:'2025-12-11',time:'9:00 AM'},
      {from:'provider',text:'I have attached our Service Agreement for your review.',date:'2025-12-11',time:'9:05 AM',attachment:{name:'Service Agreement.pdf',docType:'Service Agreement',size:'245 KB'}},
    ]},
  { id:'e2',providerId:'p2',participantId:'u2',participantName:'James Chen',providerName:'PhysioPlus Disability',
    subject:'Hydrotherapy availability',status:'active',createdAt:'2025-12-15',
    messages:[
      {from:'participant',text:'I am interested in hydrotherapy sessions for my mobility issues. What times are available?',date:'2025-12-15',time:'9:00 AM'},
      {from:'provider',text:'Hi James! We have hydrotherapy slots on Monday and Wednesday mornings. Would either work for you?',date:'2025-12-15',time:'10:30 AM'},
      {from:'participant',text:'Wednesday morning would be perfect. How do I get started?',date:'2025-12-15',time:'11:00 AM'},
    ]},
  { id:'e3',providerId:'p3',participantId:'u7',participantName:'Lucy Nguyen',providerName:'CareFirst Plan Management',
    subject:'Plan management services',status:'active',createdAt:'2025-12-08',
    messages:[
      {from:'participant',text:'Hi, I need help managing my NDIS plan. How does your service work?',date:'2025-12-08',time:'2:00 PM'},
      {from:'provider',text:'Hi Lucy! We handle all your invoice processing and budget tracking. We process invoices within 48 hours and you get real-time access through our app.',date:'2025-12-08',time:'2:30 PM'},
      {from:'provider',text:'Here is a sample invoice for your reference.',date:'2025-12-08',time:'2:35 PM',attachment:{name:'Sample Invoice - Dec 2025.pdf',docType:'Invoice',size:'89 KB'}},
    ]},
  { id:'e4',providerId:'p5',participantId:'u4',participantName:'Tom Williams',providerName:'MindBridge Psychology',
    subject:'Psychology sessions for anxiety',status:'active',createdAt:'2025-12-12',
    messages:[
      {from:'participant',text:'I am looking for a psychologist who specialises in anxiety and social situations.',date:'2025-12-12',time:'3:00 PM'},
      {from:'provider',text:'Hi Tom, we have several psychologists who specialise in anxiety. Dr. Chen has extensive experience with CBT for social anxiety. Would you like to book an initial assessment?',date:'2025-12-12',time:'4:15 PM'},
      {from:'participant',text:'Yes please, that sounds great. What is the wait time?',date:'2025-12-12',time:'4:30 PM'},
      {from:'provider',text:'Currently about 3 weeks for a new client assessment. I will add you to our waitlist and contact you as soon as a spot opens.',date:'2025-12-13',time:'9:00 AM'},
    ]},
  { id:'e5',providerId:'p10',participantId:'u5',participantName:'Priya Sharma',providerName:'Little Stars Early Intervention',
    subject:'Early intervention for my 4yo son',status:'active',createdAt:'2025-12-18',
    messages:[
      {from:'participant',text:'My son has recently been diagnosed with autism. We are looking for a multidisciplinary early intervention program.',date:'2025-12-18',time:'10:00 AM',attachment:{name:'NDIS Plan 2025.pdf',docType:'NDIS Plan',size:'1.2 MB'}},
      {from:'provider',text:'Hi Priya, thank you for reaching out. We offer comprehensive early intervention with OT, speech, and psychology. We would love to meet your son for an initial assessment.',date:'2025-12-18',time:'11:30 AM'},
    ]},
  { id:'e6',providerId:'p4',participantId:'u3',participantName:'Amira Hassan',providerName:'Accessible Living Solutions',
    subject:'SIL vacancy enquiry',status:'closed',createdAt:'2025-11-20',
    messages:[
      {from:'participant',text:'Are there any vacancies in your SIL houses in Raymond Terrace area?',date:'2025-11-20',time:'1:00 PM'},
      {from:'provider',text:'Hi Amira, we currently have one vacancy at our Raymond Terrace property. Would you like to arrange a viewing?',date:'2025-11-20',time:'2:30 PM'},
      {from:'participant',text:'Yes! When can I visit?',date:'2025-11-20',time:'3:00 PM'},
      {from:'provider',text:'How about this Thursday at 2pm? I will send you the address.',date:'2025-11-21',time:'9:00 AM'},
      {from:'participant',text:'Perfect, see you then!',date:'2025-11-21',time:'9:15 AM'},
    ]},
  { id:'e7',providerId:'p7',participantId:'u2',participantName:'James Chen',providerName:'DriveAbility Transport',
    subject:'Regular transport needed',status:'active',createdAt:'2025-12-20',
    messages:[
      {from:'participant',text:'I need wheelchair-accessible transport to physio appointments twice a week.',date:'2025-12-20',time:'8:00 AM'},
      {from:'provider',text:'Hi James! We can set up regular bookings for you. What days and times are your appointments?',date:'2025-12-20',time:'9:30 AM'},
    ]},
  { id:'e8',providerId:'p8',participantId:'u6',participantName:'Michael Brown',providerName:'WorkBridge Employment',
    subject:'Employment support enquiry',status:'active',createdAt:'2025-12-05',
    messages:[
      {from:'participant',text:'I am interested in finding employment. I have experience in retail but need help with interviews.',date:'2025-12-05',time:'11:00 AM'},
      {from:'provider',text:'Hi Michael! We would love to help. We can start with resume review and mock interviews. When would you like to come in for an initial chat?',date:'2025-12-05',time:'1:00 PM'},
      {from:'participant',text:'How about next Monday?',date:'2025-12-05',time:'1:30 PM'},
      {from:'provider',text:'Monday at 10am works. See you then!',date:'2025-12-06',time:'9:00 AM'},
    ]},
  { id:'e9',providerId:'p9',participantId:'u8',participantName:'David Park',providerName:'NurtureCare Nursing',
    subject:'Nursing care requirements',status:'active',createdAt:'2025-12-16',
    messages:[
      {from:'participant',text:'I need regular nursing visits for medication management and wound care.',date:'2025-12-16',time:'10:00 AM'},
      {from:'provider',text:'Hi David, we can certainly help. We will need to do an initial nursing assessment. Are mornings or afternoons better for you?',date:'2025-12-16',time:'11:00 AM'},
    ]},
  { id:'e10',providerId:'p15',participantId:'u2',participantName:'James Chen',providerName:'TechAssist AT Solutions',
    subject:'Wheelchair assessment',status:'closed',createdAt:'2025-11-25',
    messages:[
      {from:'participant',text:'I need a new powered wheelchair. Can you do an assessment?',date:'2025-11-25',time:'2:00 PM'},
      {from:'provider',text:'Hi James! Absolutely. Our OT can do a comprehensive wheelchair assessment. We will also arrange trials with different models.',date:'2025-11-25',time:'3:30 PM'},
      {from:'participant',text:'That sounds excellent. When is the next available appointment?',date:'2025-11-25',time:'4:00 PM'},
      {from:'provider',text:'We have an opening next Wednesday at 11am. Does that suit?',date:'2025-11-26',time:'9:00 AM'},
      {from:'participant',text:'Booked! Thank you.',date:'2025-11-26',time:'9:15 AM'},
    ]},
  { id:'e11',providerId:'p1',participantId:'u9',participantName:'Sophie Taylor',providerName:'Sunshine Support Services',
    subject:'Respite care weekends',status:'active',createdAt:'2025-12-22',
    messages:[
      {from:'participant',text:'Looking for weekend respite care services. Do you have availability?',date:'2025-12-22',time:'11:00 AM'},
      {from:'provider',text:'Hi Sophie! Yes, we offer Saturday and Sunday respite. Let us discuss what activities you enjoy.',date:'2025-12-22',time:'12:30 PM'},
    ]},
  { id:'e12',providerId:'p16',participantId:'u10',participantName:"Ryan O'Brien",providerName:'Harmony SIL Homes',
    subject:'SDA property information',status:'active',createdAt:'2025-12-28',
    messages:[
      {from:'participant',text:'Can you send me information about your SDA properties in Nelson Bay?',date:'2025-12-28',time:'9:00 AM'},
      {from:'provider',text:'Hi Ryan! I would be happy to share details. We have two SDA properties in Nelson Bay - one High Physical Support and one Robust. Would you like to visit both?',date:'2025-12-28',time:'10:30 AM'},
    ]},
];

// ── Bookings Data ──
const BOOKINGS_DATA = [
  { id:'b1',providerId:'p1',participantId:'u1',participantName:'Sarah Mitchell',providerName:'Sunshine Support Services',
    service:'Daily Living Support',date:'2026-01-06',time:'9:00 AM',duration:'3 hours',status:'confirmed',
    notes:'Help with meal prep and housekeeping' },
  { id:'b2',providerId:'p2',participantId:'u2',participantName:'James Chen',providerName:'PhysioPlus Disability',
    service:'Hydrotherapy Session',date:'2026-01-08',time:'10:00 AM',duration:'1 hour',status:'confirmed',
    notes:'Weekly hydrotherapy session' },
  { id:'b3',providerId:'p5',participantId:'u4',participantName:'Tom Williams',providerName:'MindBridge Psychology',
    service:'Psychology - CBT',date:'2026-01-07',time:'2:00 PM',duration:'1 hour',status:'confirmed',
    notes:'Fortnightly CBT session with Dr. Chen' },
  { id:'b4',providerId:'p10',participantId:'u5',participantName:'Priya Sharma',providerName:'Little Stars Early Intervention',
    service:'Multidisciplinary Assessment',date:'2026-01-09',time:'10:00 AM',duration:'2 hours',status:'pending',
    notes:'Initial assessment for early intervention' },
  { id:'b5',providerId:'p7',participantId:'u2',participantName:'James Chen',providerName:'DriveAbility Transport',
    service:'Transport to Appointment',date:'2026-01-08',time:'9:00 AM',duration:'30 min',status:'confirmed',
    notes:'Transport to PhysioPlus Maitland' },
  { id:'b6',providerId:'p1',participantId:'u3',participantName:'Amira Hassan',providerName:'Sunshine Support Services',
    service:'Community Participation',date:'2026-01-10',time:'10:00 AM',duration:'4 hours',status:'confirmed',
    notes:'Community outing - shopping centre and park' },
  { id:'b7',providerId:'p8',participantId:'u6',participantName:'Michael Brown',providerName:'WorkBridge Employment',
    service:'Employment Coaching',date:'2026-01-13',time:'10:00 AM',duration:'1.5 hours',status:'pending',
    notes:'Mock interview preparation' },
  { id:'b8',providerId:'p9',participantId:'u8',participantName:'David Park',providerName:'NurtureCare Nursing',
    service:'Nursing Visit',date:'2026-01-06',time:'8:00 AM',duration:'1 hour',status:'confirmed',
    notes:'Medication management and wound care' },
  { id:'b9',providerId:'p16',participantId:'u10',participantName:"Ryan O'Brien",providerName:'Harmony SIL Homes',
    service:'SIL Support',date:'2026-01-06',time:'All day',duration:'24 hours',status:'confirmed',
    notes:'Ongoing SIL support' },
  { id:'b10',providerId:'p17',participantId:'u5',participantName:'Priya Sharma',providerName:'SpeakEasy Speech Pathology',
    service:'Speech Therapy',date:'2026-01-07',time:'3:00 PM',duration:'45 min',status:'confirmed',
    notes:'Weekly speech therapy session for son' },
  { id:'b11',providerId:'p1',participantId:'u1',participantName:'Sarah Mitchell',providerName:'Sunshine Support Services',
    service:'Daily Living Support',date:'2026-01-08',time:'9:00 AM',duration:'3 hours',status:'confirmed',
    notes:'Regular Wednesday session' },
  { id:'b12',providerId:'p2',participantId:'u5',participantName:'Priya Sharma',providerName:'PhysioPlus Disability',
    service:'Paediatric Physio',date:'2026-01-10',time:'11:00 AM',duration:'1 hour',status:'pending',
    notes:'Physio session for son' },
  { id:'b13',providerId:'p5',participantId:'u7',participantName:'Lucy Nguyen',providerName:'MindBridge Psychology',
    service:'Psychology Session',date:'2026-01-14',time:'11:00 AM',duration:'1 hour',status:'pending',
    notes:'Initial assessment' },
  { id:'b14',providerId:'p12',participantId:'u9',participantName:'Sophie Taylor',providerName:'Happy Days Community',
    service:'Group Activity',date:'2026-01-11',time:'10:00 AM',duration:'4 hours',status:'confirmed',
    notes:'Saturday beach walk group' },
  { id:'b15',providerId:'p3',participantId:'u7',participantName:'Lucy Nguyen',providerName:'CareFirst Plan Management',
    service:'Plan Review Meeting',date:'2026-01-15',time:'10:00 AM',duration:'1 hour',status:'pending',
    notes:'Quarterly plan budget review' },
];

// ── Mock Notifications ──
const NOTIFICATIONS_DATA = [
  { id:'n1', userId:'u1', type:'message', title:'New message from Sunshine Support', body:'Hi Sarah! Absolutely, we have availability for daily living support.', link:'enquiries', read:false, createdAt:'2025-12-11T09:00:00' },
  { id:'n2', userId:'u1', type:'booking', title:'Booking confirmed', body:'Your Daily Living Support booking for Jan 6 has been confirmed.', link:'bookings', read:false, createdAt:'2025-12-10T14:30:00' },
  { id:'n3', userId:'u1', type:'review', title:'Provider responded to your review', body:'Sunshine Support Services replied to your review.', link:'my-reviews', read:true, createdAt:'2025-12-10T11:00:00' },
  { id:'n4', userId:'u1', type:'message', title:'New message from PhysioPlus', body:'James, your dedication to therapy is inspiring.', link:'enquiries', read:true, createdAt:'2025-12-09T10:00:00' },
  { id:'n5', userId:'u2', type:'booking', title:'Booking confirmed', body:'Your Hydrotherapy Session for Jan 8 is confirmed.', link:'bookings', read:false, createdAt:'2025-12-15T11:00:00' },
  { id:'n6', userId:'u2', type:'message', title:'New message from DriveAbility', body:'Hi James! We can set up regular bookings for you.', link:'enquiries', read:false, createdAt:'2025-12-20T09:30:00' },
  { id:'n7', userId:'u4', type:'message', title:'New message from MindBridge Psychology', body:'Currently about 3 weeks for a new client assessment.', link:'enquiries', read:false, createdAt:'2025-12-13T09:00:00' },
  { id:'n8', userId:'u4', type:'booking', title:'Booking confirmed', body:'Your Psychology CBT session on Jan 7 is confirmed.', link:'bookings', read:true, createdAt:'2025-12-12T16:00:00' },
  { id:'n9', userId:'u5', type:'message', title:'New message from Little Stars', body:'We offer comprehensive early intervention with OT, speech, and psychology.', link:'enquiries', read:false, createdAt:'2025-12-18T11:30:00' },
  { id:'n10', userId:'u7', type:'message', title:'New message from CareFirst', body:'We handle all your invoice processing and budget tracking.', link:'enquiries', read:false, createdAt:'2025-12-08T14:30:00' },
];

// ── Analytics Data ──
const ANALYTICS_MONTHS = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan'];
function generateAnalytics(provider) {
  const base = provider.tier === 'premium' ? 300 : provider.tier === 'professional' ? 150 : 50;
  return ANALYTICS_MONTHS.map((month, i) => ({
    month,
    views: Math.floor(base * (0.8 + Math.random() * 0.6) + i * 15),
    enquiries: Math.floor((base/10) * (0.7 + Math.random() * 0.8) + i * 2),
    bookings: Math.floor((base/20) * (0.6 + Math.random() * 0.9) + i),
    searchAppearances: Math.floor(base * 1.5 * (0.8 + Math.random() * 0.5) + i * 20),
  }));
}

const CATEGORY_ANALYTICS = [
  { name: 'Daily Living', value: 35 },
  { name: 'Therapy', value: 25 },
  { name: 'Community', value: 20 },
  { name: 'Transport', value: 10 },
  { name: 'Other', value: 10 },
];

const PIE_COLORS = [COLORS.primary[500], COLORS.accent[500], COLORS.primary[300], COLORS.accent[300], COLORS.primary[700]];

// ── Subscription Plans ──
const PLANS = [
  { id:'starter',name:'Starter',price:0,priceAnnual:0,popular:false,
    features:['Basic listing','200-character description','5 enquiries per month','Standard search placement','Email support'],
    limits:{ descLength:200, enquiriesPerMonth:5, photos:0, analytics:false, directBooking:false, verified:false, promoted:false }},
  { id:'professional',name:'Professional',price:49,priceAnnual:39,popular:true,
    stripePriceIdMonthly:'price_1T4xNQBbYMwhcgg97GpcozvG',stripePriceIdYearly:'price_1T4xPHBbYMwhcgg9GSdDpsON',
    features:['Featured placement','Full profile with photos','Unlimited enquiries','Analytics dashboard','Priority email support','Review responses','Up to 10 photos'],
    limits:{ descLength:2000, enquiriesPerMonth:Infinity, photos:10, analytics:true, directBooking:false, verified:false, promoted:false }},
  { id:'premium',name:'Premium',price:149,priceAnnual:119,popular:false,
    stripePriceIdMonthly:'price_1T4xQIBbYMwhcgg9gLXhv8dG',stripePriceIdYearly:'price_1T4xQnBbYMwhcgg9YJvx5b50',
    features:['Top search placement','Verified provider badge','Direct booking system','Lead generation tools','Promoted listings','Dedicated account manager','Unlimited photos','Full analytics suite'],
    limits:{ descLength:5000, enquiriesPerMonth:Infinity, photos:Infinity, analytics:true, directBooking:true, verified:true, promoted:true }},
];

// ── Response Time Calculator ──
function calcResponseTime(provider, enquiries) {
  const pEnquiries = enquiries.filter(e => e.providerId === provider.id && e.messages.length >= 2);
  if (pEnquiries.length === 0) {
    // Fall back to provider.responseTime string
    const rt = provider.responseTime || '';
    if (rt.includes('1 hour') || rt.includes('< 2')) return 'Usually responds within 2 hours';
    if (rt.includes('< 4') || rt.includes('3 hours')) return 'Usually responds within 4 hours';
    if (rt.includes('< 6') || rt.includes('5')) return 'Usually responds within 6 hours';
    if (rt.includes('< 8') || rt.includes('8 hours')) return 'Usually responds within 8 hours';
    if (rt.includes('1-2 days') || rt.includes('2 days')) return 'Usually responds within 2 days';
    if (rt.includes('2-3 days') || rt.includes('3 days')) return 'Usually responds within 3 days';
    return 'Usually responds within 24 hours';
  }
  // Calculate from actual message timestamps
  let totalHours = 0;
  let count = 0;
  pEnquiries.forEach(e => {
    const firstParticipant = e.messages.find(m => m.from === 'participant');
    const firstProvider = e.messages.find(m => m.from === 'provider');
    if (firstParticipant && firstProvider) {
      const sent = new Date(`${firstParticipant.date} ${firstParticipant.time}`);
      const replied = new Date(`${firstProvider.date} ${firstProvider.time}`);
      const diffHours = (replied - sent) / (1000 * 60 * 60);
      if (diffHours > 0 && diffHours < 168) { totalHours += diffHours; count++; }
    }
  });
  if (count === 0) return 'Usually responds within 24 hours';
  const avgH = Math.round(totalHours / count);
  if (avgH < 2) return 'Usually responds within 1 hour';
  if (avgH < 12) return `Usually responds within ${avgH} hours`;
  const days = Math.round(avgH / 24);
  return `Usually responds within ${days} ${days === 1 ? 'day' : 'days'}`;
}

// ── Onboarding Steps Checker ──
function getOnboardingSteps(provider) {
  return [
    { key: 'profile', label: 'Complete Profile', done: !!(provider.description && provider.description.length > 50 && provider.phone) },
    { key: 'services', label: 'Add Services', done: provider.categories && provider.categories.length > 0 },
    { key: 'availability', label: 'Set Availability', done: !!(provider.availability && Object.values(provider.availability).some(v => v !== 'Closed')) },
    { key: 'screening', label: 'Upload Screening', done: provider.workerScreeningStatus === 'verified' || provider.workerScreeningStatus === 'pending' },
    { key: 'golive', label: 'Go Live', done: !!(provider.verified) },
  ];
}

// ── Search & Ranking Algorithm ──
function rankProviders(providers, query, filters) {
  let results = [...providers];

  // Text search
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q) ||
      p.suburb.toLowerCase().includes(q) ||
      p.categories.some(c => {
        const cat = CATEGORIES.find(ct => ct.id === c);
        return cat && cat.name.toLowerCase().includes(q);
      }) ||
      p.serviceAreas.some(a => a.toLowerCase().includes(q))
    );
  }

  // Category filter
  if (filters.category) {
    results = results.filter(p => p.categories.includes(filters.category));
  }

  // Suburb filter
  if (filters.suburb) {
    results = results.filter(p => p.suburb === filters.suburb || p.serviceAreas.some(a => a.toLowerCase().includes(filters.suburb.toLowerCase())));
  }

  // Wait time filter
  if (filters.waitTime) {
    const wMap = { 'immediate': 0, '1-week': 7, '2-weeks': 14, '1-month': 30 };
    const maxDays = wMap[filters.waitTime] || 999;
    results = results.filter(p => {
      if (p.waitTime === 'Immediate') return true;
      const m = p.waitTime.match(/(\d+)/);
      if (!m) return true;
      const days = p.waitTime.includes('week') ? parseInt(m[1]) * 7 : parseInt(m[1]) * 30;
      return days <= maxDays;
    });
  }

  // Plan type filter
  if (filters.planType) {
    results = results.filter(p => p.planTypes.includes(filters.planType));
  }

  // Rating filter
  if (filters.minRating) {
    results = results.filter(p => p.rating >= filters.minRating);
  }

  // Verified only
  if (filters.verifiedOnly) {
    results = results.filter(p => p.verified);
  }

  // Sort by tier weight + rating + response rate
  results.sort((a, b) => {
    const tierWeight = { premium: 100, professional: 50, starter: 0 };
    const scoreA = tierWeight[a.tier] + (a.rating * 10) + (a.responseRate * 0.5);
    const scoreB = tierWeight[b.tier] + (b.rating * 10) + (b.responseRate * 0.5);
    return scoreB - scoreA;
  });

  return results;
}

// ── State Management (useReducer) ──
const ACTION_TYPES = {
  SET_THEME: 'SET_THEME',
  NAV_GOTO: 'NAV_GOTO',
  NAV_BACK: 'NAV_BACK',
  SET_USER: 'SET_USER',
  LOGOUT: 'LOGOUT',
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_SEARCH_FILTERS: 'SET_SEARCH_FILTERS',
  CLEAR_FILTERS: 'CLEAR_FILTERS',
  SET_SELECTED_PROVIDER: 'SET_SELECTED_PROVIDER',
  TOGGLE_FAVOURITE: 'TOGGLE_FAVOURITE',
  SEND_ENQUIRY: 'SEND_ENQUIRY',
  REPLY_ENQUIRY: 'REPLY_ENQUIRY',
  CLOSE_ENQUIRY: 'CLOSE_ENQUIRY',
  CREATE_BOOKING: 'CREATE_BOOKING',
  UPDATE_BOOKING: 'UPDATE_BOOKING',
  CANCEL_BOOKING: 'CANCEL_BOOKING',
  SUBMIT_REVIEW: 'SUBMIT_REVIEW',
  RESPOND_REVIEW: 'RESPOND_REVIEW',
  UPDATE_PROVIDER_PROFILE: 'UPDATE_PROVIDER_PROFILE',
  UPDATE_PARTICIPANT_PROFILE: 'UPDATE_PARTICIPANT_PROFILE',
  UPGRADE_PLAN: 'UPGRADE_PLAN',
  DOWNGRADE_PLAN: 'DOWNGRADE_PLAN',
  APPROVE_PROVIDER: 'APPROVE_PROVIDER',
  REJECT_PROVIDER: 'REJECT_PROVIDER',
  SUSPEND_USER: 'SUSPEND_USER',
  SET_SIDEBAR_OPEN: 'SET_SIDEBAR_OPEN',
  SET_MODAL: 'SET_MODAL',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_DASHBOARD_TAB: 'SET_DASHBOARD_TAB',
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  SET_VIEW_MODE: 'SET_VIEW_MODE',
  SET_BILLING_CYCLE: 'SET_BILLING_CYCLE',
  SET_REGISTER_STEP: 'SET_REGISTER_STEP',
  SET_REGISTER_ROLE: 'SET_REGISTER_ROLE',
  TOGGLE_FAQ: 'TOGGLE_FAQ',
  SET_TESTIMONIAL_INDEX: 'SET_TESTIMONIAL_INDEX',
  INCREMENT_VIEWS: 'INCREMENT_VIEWS',
  SET_MOBILE_SIDEBAR: 'SET_MOBILE_SIDEBAR',
  SET_LOADING: 'SET_LOADING',
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ',
  MARK_ALL_NOTIFICATIONS_READ: 'MARK_ALL_NOTIFICATIONS_READ',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  SET_DB_PROVIDERS: 'SET_DB_PROVIDERS',
  SET_DB_PARTICIPANTS: 'SET_DB_PARTICIPANTS',
  SET_DB_REVIEWS: 'SET_DB_REVIEWS',
  SET_DB_ENQUIRIES: 'SET_DB_ENQUIRIES',
  SET_DB_BOOKINGS: 'SET_DB_BOOKINGS',
  MERGE_DB_DATA: 'MERGE_DB_DATA',
  // New feature action types
  UPDATE_WORKER_SCREENING: 'UPDATE_WORKER_SCREENING',
  TOGGLE_COMPARE_PROVIDER: 'TOGGLE_COMPARE_PROVIDER',
  CLEAR_COMPARE: 'CLEAR_COMPARE',
  SUBMIT_REPORT: 'SUBMIT_REPORT',
  UPDATE_REPORT_STATUS: 'UPDATE_REPORT_STATUS',
  SET_ONBOARDING_STEP: 'SET_ONBOARDING_STEP',
};

function getInitialState() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('nexaconnect_state') || '{}'); } catch(e) {}
  return {
    theme: saved.theme || 'dark',
    route: saved.user ? (saved.user.role === 'admin' ? 'admin-dashboard' : saved.user.role === 'provider' ? 'provider-dashboard' : 'participant-dashboard') : 'landing',
    routeHistory: [],
    routeParams: {},
    user: saved.user || null,
    providers: PROVIDERS_DATA,
    participants: PARTICIPANTS_DATA,
    reviews: REVIEWS_DATA,
    enquiries: ENQUIRIES_DATA,
    bookings: BOOKINGS_DATA,
    searchQuery: '',
    searchFilters: { category: '', suburb: '', waitTime: '', planType: '', minRating: 0, verifiedOnly: false },
    selectedProviderId: null,
    sidebarOpen: true,
    mobileSidebarOpen: false,
    modal: null,
    activeTab: 'overview',
    dashboardTab: 'overview',
    viewMode: 'grid',
    billingCycle: 'monthly',
    registerStep: 1,
    registerRole: 'participant',
    faqOpen: {},
    testimonialIndex: 0,
    loading: true,
    compareProviders: [],
    reports: [],
    notifications: NOTIFICATIONS_DATA,
  };
}

function appReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_THEME:
      return { ...state, theme: action.payload };
    case ACTION_TYPES.NAV_GOTO:
      return { ...state, route: action.payload.route, routeParams: action.payload.params || {},
        routeHistory: [...state.routeHistory, { route: state.route, params: state.routeParams }],
        mobileSidebarOpen: false };
    case ACTION_TYPES.NAV_BACK: {
      const prev = state.routeHistory[state.routeHistory.length - 1];
      if (!prev) return state;
      return { ...state, route: prev.route, routeParams: prev.params || {},
        routeHistory: state.routeHistory.slice(0, -1) };
    }
    case ACTION_TYPES.LOGIN:
    case ACTION_TYPES.SET_USER:
      return { ...state, user: action.payload };
    case ACTION_TYPES.LOGOUT:
      return { ...state, user: null, route: 'landing', routeHistory: [], routeParams: {} };
    case ACTION_TYPES.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload };
    case ACTION_TYPES.SET_SEARCH_FILTERS:
      return { ...state, searchFilters: { ...state.searchFilters, ...action.payload } };
    case ACTION_TYPES.CLEAR_FILTERS:
      return { ...state, searchQuery: '', searchFilters: { category: '', suburb: '', waitTime: '', planType: '', minRating: 0, verifiedOnly: false } };
    case ACTION_TYPES.SET_SELECTED_PROVIDER:
      return { ...state, selectedProviderId: action.payload };
    case ACTION_TYPES.TOGGLE_FAVOURITE: {
      if (!state.user || state.user.role !== 'participant') return state;
      const pid = action.payload;
      const part = state.participants.find(p => p.id === state.user.id);
      if (!part) return state;
      const favs = part.favourites.includes(pid) ? part.favourites.filter(f => f !== pid) : [...part.favourites, pid];
      const updatedParticipants = state.participants.map(p => p.id === state.user.id ? { ...p, favourites: favs } : p);
      return { ...state, participants: updatedParticipants, user: { ...state.user, favourites: favs } };
    }
    case ACTION_TYPES.SEND_ENQUIRY: {
      const newEnq = { id: 'e' + (state.enquiries.length + 1), ...action.payload, status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        messages: [{ from: 'participant', text: action.payload.message, date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit',hour12:true}) }] };
      return { ...state, enquiries: [...state.enquiries, newEnq] };
    }
    case ACTION_TYPES.REPLY_ENQUIRY: {
      const { enquiryId, text, from } = action.payload;
      return { ...state, enquiries: state.enquiries.map(e => e.id === enquiryId ? { ...e, messages: [...e.messages, {
        from, text, date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit',hour12:true})
      }]} : e) };
    }
    case ACTION_TYPES.CLOSE_ENQUIRY:
      return { ...state, enquiries: state.enquiries.map(e => e.id === action.payload ? { ...e, status: 'closed' } : e) };
    case ACTION_TYPES.CREATE_BOOKING: {
      const newBooking = { id: 'b' + (state.bookings.length + 1), ...action.payload, status: 'pending' };
      return { ...state, bookings: [...state.bookings, newBooking] };
    }
    case ACTION_TYPES.UPDATE_BOOKING:
      return { ...state, bookings: state.bookings.map(b => b.id === action.payload.id ? { ...b, ...action.payload } : b) };
    case ACTION_TYPES.CANCEL_BOOKING:
      return { ...state, bookings: state.bookings.map(b => b.id === action.payload ? { ...b, status: 'cancelled' } : b) };
    case ACTION_TYPES.SUBMIT_REVIEW: {
      const newReview = { id: 'r' + (state.reviews.length + 1), ...action.payload, date: new Date().toISOString().split('T')[0], response: null, responseDate: null };
      return { ...state, reviews: [...state.reviews, newReview] };
    }
    case ACTION_TYPES.RESPOND_REVIEW: {
      return { ...state, reviews: state.reviews.map(r => r.id === action.payload.reviewId ? { ...r, response: action.payload.response, responseDate: new Date().toISOString().split('T')[0] } : r) };
    }
    case ACTION_TYPES.UPDATE_PROVIDER_PROFILE:
      return { ...state, providers: state.providers.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p) };
    case ACTION_TYPES.UPDATE_PARTICIPANT_PROFILE:
      return { ...state, participants: state.participants.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p),
        user: state.user && state.user.id === action.payload.id ? { ...state.user, ...action.payload } : state.user };
    case ACTION_TYPES.UPGRADE_PLAN:
      return { ...state, providers: state.providers.map(p => p.id === action.payload.providerId ? { ...p, tier: action.payload.tier } : p) };
    case ACTION_TYPES.SET_SIDEBAR_OPEN:
      return { ...state, sidebarOpen: action.payload };
    case ACTION_TYPES.SET_MOBILE_SIDEBAR:
      return { ...state, mobileSidebarOpen: action.payload };
    case ACTION_TYPES.SET_MODAL:
      return { ...state, modal: action.payload };
    case ACTION_TYPES.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };
    case ACTION_TYPES.SET_DASHBOARD_TAB:
      return { ...state, dashboardTab: action.payload };
    case ACTION_TYPES.SET_VIEW_MODE:
      return { ...state, viewMode: action.payload };
    case ACTION_TYPES.SET_BILLING_CYCLE:
      return { ...state, billingCycle: action.payload };
    case ACTION_TYPES.SET_REGISTER_STEP:
      return { ...state, registerStep: action.payload };
    case ACTION_TYPES.SET_REGISTER_ROLE:
      return { ...state, registerRole: action.payload };
    case ACTION_TYPES.TOGGLE_FAQ:
      return { ...state, faqOpen: { ...state.faqOpen, [action.payload]: !state.faqOpen[action.payload] } };
    case ACTION_TYPES.SET_TESTIMONIAL_INDEX:
      return { ...state, testimonialIndex: action.payload };
    case ACTION_TYPES.INCREMENT_VIEWS:
      return { ...state, providers: state.providers.map(p => p.id === action.payload ? { ...p, viewsThisMonth: p.viewsThisMonth + 1 } : p) };
    case ACTION_TYPES.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTION_TYPES.UPDATE_WORKER_SCREENING:
      return { ...state, providers: state.providers.map(p => p.id === action.payload.id ? { ...p, workerScreeningNumber: action.payload.number, workerScreeningExpiry: action.payload.expiry, workerScreeningStatus: action.payload.status } : p) };
    case ACTION_TYPES.TOGGLE_COMPARE_PROVIDER: {
      const cid = action.payload;
      const already = state.compareProviders.includes(cid);
      if (already) return { ...state, compareProviders: state.compareProviders.filter(x => x !== cid) };
      if (state.compareProviders.length >= 3) return state;
      return { ...state, compareProviders: [...state.compareProviders, cid] };
    }
    case ACTION_TYPES.CLEAR_COMPARE:
      return { ...state, compareProviders: [] };
    case ACTION_TYPES.SUBMIT_REPORT: {
      const newReport = { id: 'rep' + (state.reports.length + 1), ...action.payload, status: 'pending', submittedAt: new Date().toISOString().split('T')[0] };
      return { ...state, reports: [...state.reports, newReport] };
    }
    case ACTION_TYPES.UPDATE_REPORT_STATUS:
      return { ...state, reports: state.reports.map(r => r.id === action.payload.id ? { ...r, status: action.payload.status } : r) };
    case ACTION_TYPES.SET_ONBOARDING_STEP:
      return { ...state, providers: state.providers.map(p => p.id === action.payload.id ? { ...p, onboardingStep: action.payload.step } : p) };
    case ACTION_TYPES.MARK_NOTIFICATION_READ:
      return { ...state, notifications: (state.notifications || []).map(n => n.id === action.payload ? { ...n, read: true } : n) };
    case ACTION_TYPES.MARK_ALL_NOTIFICATIONS_READ:
      return { ...state, notifications: (state.notifications || []).map(n => ({ ...n, read: true })) };
    case ACTION_TYPES.ADD_NOTIFICATION: {
      const newNotif = { id: 'notif_' + Date.now(), ...action.payload, read: false, createdAt: new Date().toISOString() };
      return { ...state, notifications: [newNotif, ...(state.notifications || [])] };
    }
    case ACTION_TYPES.SET_DB_PROVIDERS:
      // Merge DB providers with mock seed data (seed data keeps mock IDs like p1, p2, etc.)
      return { ...state, providers: [...PROVIDERS_DATA, ...action.payload.filter(dbp => !PROVIDERS_DATA.some(mp => mp.email === dbp.email))] };
    case ACTION_TYPES.SET_DB_PARTICIPANTS:
      return { ...state, participants: [...PARTICIPANTS_DATA, ...action.payload.filter(dbp => !PARTICIPANTS_DATA.some(mp => mp.email === dbp.email))] };
    case ACTION_TYPES.SET_DB_REVIEWS:
      return { ...state, reviews: [...REVIEWS_DATA, ...action.payload.filter(dbr => !REVIEWS_DATA.some(mr => mr.id === dbr.id))] };
    case ACTION_TYPES.SET_DB_ENQUIRIES:
      return { ...state, enquiries: [...ENQUIRIES_DATA, ...action.payload.filter(dbe => !ENQUIRIES_DATA.some(me => me.id === dbe.id))] };
    case ACTION_TYPES.SET_DB_BOOKINGS:
      return { ...state, bookings: [...BOOKINGS_DATA, ...action.payload.filter(dbb => !BOOKINGS_DATA.some(mb => mb.id === dbb.id))] };
    default:
      return state;
  }
}

// ── App Context ──
const AppContext = createContext(null);
function useApp() { return useContext(AppContext); }


/* ═══════════════════════════════════════════════════════════════
   Phase 3: Layout & Navigation
   ═══════════════════════════════════════════════════════════════ */

function NotificationPanel({ onClose }) {
  const { theme } = useTheme();
  const { state, dispatch } = useApp();
  const c = COLORS[theme];
  const responsive = useResponsive();

  if (!state.user) return null;
  const notifications = (state.notifications || []).filter(n => n.userId === state.user.id);
  const unreadCount = notifications.filter(n => !n.read).length;

  const typeIcon = (type) => {
    if (type === 'message') return Icons.mail(16, COLORS.primary[400]);
    if (type === 'booking') return Icons.calendar(16, COLORS.success);
    if (type === 'review') return Icons.star(16, COLORS.star);
    return Icons.bell(16, c.textSecondary);
  };

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now - d;
      const diffH = Math.floor(diffMs / 3600000);
      const diffD = Math.floor(diffMs / 86400000);
      if (diffH < 1) return 'Just now';
      if (diffH < 24) return diffH + 'h ago';
      if (diffD < 7) return diffD + 'd ago';
      return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    } catch(e) { return ''; }
  };

  return React.createElement('div', {
    style: {
      position: 'absolute', top: '100%', right: 0, marginTop: '8px',
      width: responsive.isMobile ? '320px' : '380px', maxWidth: '95vw',
      background: c.surface, border: `1px solid ${c.border}`,
      borderRadius: RADIUS.lg, boxShadow: c.cardShadow,
      zIndex: 300, overflow: 'hidden',
      animation: 'nc-fadeInDown 0.2s ease',
    },
  },
    // Header
    React.createElement('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: `1px solid ${c.border}` },
    },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        React.createElement('h3', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text } }, 'Notifications'),
        unreadCount > 0 && React.createElement(Badge, { variant: 'error', size: 'xs' }, unreadCount + ' new'),
      ),
      unreadCount > 0 && React.createElement('button', {
        onClick: () => dispatch({ type: ACTION_TYPES.MARK_ALL_NOTIFICATIONS_READ }),
        style: { background: 'none', border: 'none', cursor: 'pointer', color: COLORS.primary[500], fontSize: FONT_SIZES.xs, fontWeight: 600, fontFamily: FONTS.sans },
      }, 'Mark all read'),
    ),
    // List
    React.createElement('div', { style: { maxHeight: '400px', overflowY: 'auto' } },
      notifications.length === 0
        ? React.createElement('div', { style: { padding: '32px 16px', textAlign: 'center', color: c.textMuted, fontSize: FONT_SIZES.sm } },
            Icons.bell(32, c.textMuted),
            React.createElement('p', { style: { marginTop: '8px' } }, 'No notifications yet'),
          )
        : notifications.map(n => React.createElement('div', {
            key: n.id,
            onClick: () => {
              dispatch({ type: ACTION_TYPES.MARK_NOTIFICATION_READ, payload: n.id });
              if (n.link) {
                const role = state.user.role;
                const route = role === 'provider' ? 'provider-dashboard' : role === 'participant' ? 'participant-dashboard' : 'admin-dashboard';
                dispatch({ type: ACTION_TYPES.NAV_GOTO, payload: { route } });
                dispatch({ type: ACTION_TYPES.SET_DASHBOARD_TAB, payload: n.link });
              }
              onClose();
            },
            style: {
              display: 'flex', gap: '12px', padding: '12px 16px', cursor: 'pointer',
              background: n.read ? 'transparent' : (theme === 'dark' ? `${COLORS.primary[500]}08` : `${COLORS.primary[500]}06`),
              borderBottom: `1px solid ${c.border}`,
              transition: 'background 0.15s',
            },
            onMouseEnter: (e) => e.currentTarget.style.background = c.surfaceHover,
            onMouseLeave: (e) => e.currentTarget.style.background = n.read ? 'transparent' : (theme === 'dark' ? `${COLORS.primary[500]}08` : `${COLORS.primary[500]}06`),
          },
            // Icon circle
            React.createElement('div', {
              style: {
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: COLORS.gradientCard, display: 'flex', alignItems: 'center', justifyContent: 'center',
              },
            }, typeIcon(n.type)),
            // Content
            React.createElement('div', { style: { flex: 1, minWidth: 0 } },
              React.createElement('p', {
                style: { fontSize: FONT_SIZES.sm, fontWeight: n.read ? 500 : 700, color: c.text, marginBottom: '2px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
              }, n.title),
              React.createElement('p', {
                style: { fontSize: FONT_SIZES.xs, color: c.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
              }, n.body),
              React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, marginTop: '2px' } }, formatTime(n.createdAt)),
            ),
            // Unread dot
            !n.read && React.createElement('div', {
              style: { width: 8, height: 8, borderRadius: '50%', background: COLORS.primary[500], flexShrink: 0, marginTop: '4px' },
            }),
          )),
    ),
  );
}

function Navbar() {
  const { theme } = useTheme();
  const { state, dispatch } = useApp();
  const responsive = useResponsive();
  const c = COLORS[theme];
  const isMarketing = ['landing','pricing','login','register','directory','provider-profile','help','contact','ndis-resources','about','privacy','terms','ndis-code-of-conduct','complaints'].includes(state.route);
  const isLoggedIn = !!state.user;
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  useEffect(() => {
    if (!showUserDropdown) return;
    const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowUserDropdown(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);
  useEffect(() => {
    if (!showNotifications) return;
    const handleClickOutside = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);
  const userNotifications = isLoggedIn && state.notifications
    ? state.notifications.filter(n => n.userId === state.user?.id)
    : [];
  const unreadNotifCount = userNotifications.filter(n => !n.read).length;
  const hasNotifications = isLoggedIn && (() => {
    if (state.user.role === 'admin') return true;
    const prov = state.user.role === 'provider' ? state.providers.find(p => p.email === state.user.email) : null;
    return state.enquiries.some(e => e.status === 'active' && (prov ? e.providerId === prov.id : e.participantId === state.user.id))
      || state.bookings.some(b => b.status === 'pending' && (prov ? b.providerId === prov.id : b.participantId === state.user.id));
  })();

  return React.createElement('nav', {
    style: {
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 28px',
      height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: isMarketing ? c.navBg : c.surface,
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${c.border}`,
      transition: 'all 0.3s',
    },
  },
    // Left: Logo + mobile menu
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
      isLoggedIn && !isMarketing && React.createElement('button', {
        onClick: () => responsive.isMobile ? dispatch({type:ACTION_TYPES.SET_MOBILE_SIDEBAR,payload:!state.mobileSidebarOpen}) : dispatch({type:ACTION_TYPES.SET_SIDEBAR_OPEN,payload:!state.sidebarOpen}),
        style: { background:'none',border:'none',cursor:'pointer',color:c.text,display:'flex',padding:'4px' },
      }, Icons.menu()),
      React.createElement('div', {
        onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'landing'}}),
        style: { cursor: 'pointer', display: 'flex', alignItems: 'center' },
      },
        React.createElement('div', { style: { width: 36, height: 36, borderRadius: RADIUS.md, background: COLORS.primary[600], position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
          React.createElement('div', { style: { width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff', position: 'absolute', left: 6, top: 8 } }),
          React.createElement('div', { style: { width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.6)', position: 'absolute', right: 6, bottom: 8 } }),
        ),
        React.createElement('span', { style: { fontFamily: FONTS.display, fontWeight: 500, fontSize: FONT_SIZES.lg, color: c.text, marginLeft: '10px' } }, 'NexaConnect'),
      ),
    ),

    // Center: Nav links (desktop + marketing)
    !responsive.isMobile && isMarketing && React.createElement('div', { style: { display: 'flex', gap: '40px', alignItems: 'center' } },
      ['Directory','Pricing','About'].map(item => React.createElement('button', {
        key: item,
        onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route: item.toLowerCase()}}),
        style: { background: 'none', border: 'none', color: c.textSecondary, cursor: 'pointer',
          fontSize: FONT_SIZES.base, fontWeight: 500, fontFamily: FONTS.sans, transition: 'color 0.2s' },
        onMouseEnter: (e) => e.target.style.color = COLORS.primary[500],
        onMouseLeave: (e) => e.target.style.color = c.textSecondary,
      }, item)),
    ),

    // Right: Actions
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '16px' } },
      React.createElement('button', {
        onClick: () => {
          const newTheme = theme === 'dark' ? 'light' : 'dark';
          dispatch({type:ACTION_TYPES.SET_THEME,payload:newTheme});
        },
        style: { background: 'none', border: 'none', cursor: 'pointer', color: c.textSecondary, display: 'flex', padding: '8px' },
      }, theme === 'dark' ? Icons.sun(24) : Icons.moon(24)),

      !isLoggedIn && React.createElement(Fragment, null,
        !responsive.isMobile && React.createElement(Button, {
          variant: 'ghost', size: 'md',
          onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'login'}}),
        }, 'Log In'),
        React.createElement(Button, {
          variant: 'primary', size: 'md',
          onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'register'}}),
        }, 'Get Started'),
      ),

      isLoggedIn && React.createElement(Fragment, null,
        React.createElement('div', {
          ref: notifRef,
          style: { position: 'relative' },
        },
          React.createElement('button', {
            onClick: () => setShowNotifications(!showNotifications),
            style: { background:'none',border:'none',cursor:'pointer',color:c.textSecondary,display:'flex',position:'relative',padding:'8px' },
          }, Icons.bell(24),
            unreadNotifCount > 0 && React.createElement('span', {
              style: {
                position:'absolute',top:2,right:2,minWidth:16,height:16,borderRadius:RADIUS.full,background:COLORS.error,
                color:'#fff',fontSize:'10px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px',
              },
            }, unreadNotifCount > 9 ? '9+' : unreadNotifCount),
          ),
          showNotifications && React.createElement(NotificationPanel, { onClose: () => setShowNotifications(false) }),
        ),
                React.createElement('div', {
          ref: dropdownRef,
          style: { position: 'relative' },
        },
          React.createElement('div', {
            onClick: () => setShowUserDropdown(!showUserDropdown),
            style: { cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
          },
            React.createElement(Avatar, { name: state.user.name, size: 40 }),
            !responsive.isMobile && React.createElement('span', { style: { fontSize: FONT_SIZES.base, fontWeight: 600, color: c.text } }, state.user.name),
            Icons.chevronDown(18, c.textSecondary),
          ),
          showUserDropdown && React.createElement('div', {
            style: {
              position: 'absolute', top: '100%', right: 0, marginTop: '8px',
              minWidth: '180px', background: c.surface, border: `1px solid ${c.border}`,
              borderRadius: RADIUS.md, boxShadow: c.cardShadow, overflow: 'hidden', zIndex: 200,
            },
          },
            React.createElement('button', {
              onClick: () => { const route = state.user.role === 'admin' ? 'admin-dashboard' : state.user.role === 'provider' ? 'provider-dashboard' : 'participant-dashboard'; dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route}}); dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload:'overview'}); setShowUserDropdown(false); },
              style: { width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px',background:'none',border:'none',cursor:'pointer',color:c.text,fontFamily:FONTS.sans,fontSize:FONT_SIZES.sm,fontWeight:600,textAlign:'left' },
              onMouseEnter: (e) => e.currentTarget.style.background = c.surfaceHover,
              onMouseLeave: (e) => e.currentTarget.style.background = 'none',
            }, Icons.home(16, c.textSecondary), 'Dashboard'),
            React.createElement('button', {
              onClick: () => { const route = state.user.role === 'admin' ? 'admin-dashboard' : state.user.role === 'provider' ? 'provider-dashboard' : 'participant-dashboard'; dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route}}); dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload: state.user.role === 'provider' ? 'profile-edit' : state.user.role === 'participant' ? 'settings' : 'users'}); setShowUserDropdown(false); },
              style: { width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px',background:'none',border:'none',cursor:'pointer',color:c.text,fontFamily:FONTS.sans,fontSize:FONT_SIZES.sm,fontWeight:600,textAlign:'left' },
              onMouseEnter: (e) => e.currentTarget.style.background = c.surfaceHover,
              onMouseLeave: (e) => e.currentTarget.style.background = 'none',
            }, Icons.settings(16, c.textSecondary), 'Settings'),
            React.createElement('div', { style: { height:'1px',background:c.border,margin:'4px 0' } }),
            React.createElement('button', {
              onClick: () => { if (isSupabaseConfigured()) supabase.auth.signOut(); dispatch({type:ACTION_TYPES.LOGOUT}); setShowUserDropdown(false); },
              style: { width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px',background:'none',border:'none',cursor:'pointer',color:COLORS.error,fontFamily:FONTS.sans,fontSize:FONT_SIZES.sm,fontWeight:600,textAlign:'left' },
              onMouseEnter: (e) => e.currentTarget.style.background = c.surfaceHover,
              onMouseLeave: (e) => e.currentTarget.style.background = 'none',
            }, Icons.logout(16, COLORS.error), 'Log Out'),
          ),
        ),
      ),
    ),
  );
}

function Sidebar() {
  const { theme } = useTheme();
  const { state, dispatch } = useApp();
  const responsive = useResponsive();
  const c = COLORS[theme];

  if (!state.user) return null;
  const isMarketing = ['landing','pricing','login','register','directory','provider-profile','help','contact','ndis-resources','about','privacy','terms','ndis-code-of-conduct','complaints'].includes(state.route);
  if (isMarketing) return null;

  const role = state.user.role;
  const isOpen = responsive.isMobile ? state.mobileSidebarOpen : state.sidebarOpen;

  const providerNav = [
    { key:'overview',label:'Overview',icon:Icons.home },
    { key:'analytics',label:'Analytics',icon:Icons.barChart },
    { key:'profile-edit',label:'Edit Profile',icon:Icons.edit },
    { key:'inbox',label:'Inbox',icon:Icons.mail },
    { key:'bookings',label:'Bookings',icon:Icons.calendar },
    { key:'reviews',label:'Reviews',icon:Icons.star },
    { key:'subscription',label:'Subscription',icon:Icons.creditCard },
  ];
  const participantNav = [
    { key:'overview',label:'Overview',icon:Icons.home },
    { key:'favourites',label:'Favourites',icon:Icons.heart },
    { key:'enquiries',label:'Enquiries',icon:Icons.mail },
    { key:'bookings',label:'Bookings',icon:Icons.calendar },
    { key:'my-reviews',label:'My Reviews',icon:Icons.star },
    { key:'settings',label:'Settings',icon:Icons.settings },
  ];
  const adminNav = [
    { key:'overview',label:'Overview',icon:Icons.home },
    { key:'users',label:'Users',icon:Icons.users },
    { key:'providers-mgmt',label:'Providers',icon:Icons.briefcase },
    { key:'revenue',label:'Revenue',icon:Icons.dollarSign },
    { key:'activity',label:'Activity',icon:Icons.activity },
    { key:'reports',label:'Reports',icon:Icons.flag },
  ];

  const navItems = role === 'admin' ? adminNav : role === 'provider' ? providerNav : participantNav;

  const sidebarContent = React.createElement('div', {
    style: {
      width: isOpen ? '240px' : '0px', height: 'calc(100vh - 72px)', position: 'fixed',
      top: '72px', left: 0, background: c.surface, borderRight: `1px solid ${c.border}`,
      transition: 'width 0.3s ease', overflow: 'hidden', zIndex: 50,
      display: 'flex', flexDirection: 'column',
    },
  },
    React.createElement('div', { style: { padding: '16px', flex: 1, overflowY: 'auto' } },
      // Role badge
      React.createElement('div', { style: { padding: '8px 12px', marginBottom: '16px', borderRadius: RADIUS.md, background: COLORS.gradientCard } },
        React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 } },
          role === 'admin' ? 'Admin Panel' : role === 'provider' ? 'Provider Dashboard' : 'My Dashboard'),
        state.user.role === 'provider' && React.createElement(Badge, {
          variant: state.providers?.find(p => p.email === state.user.email)?.tier || 'starter',
          size: 'xs',
          style: { marginTop: '4px' },
        }, (state.providers?.find(p => p.email === state.user.email)?.tier || 'starter').charAt(0).toUpperCase() + (state.providers?.find(p => p.email === state.user.email)?.tier || 'starter').slice(1) + ' Plan'),
      ),

      // Nav items
      navItems.map(item => React.createElement('button', {
        key: item.key,
        onClick: () => dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload:item.key}),
        style: {
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
          borderRadius: RADIUS.md, border: 'none', cursor: 'pointer', marginBottom: '2px',
          background: state.dashboardTab === item.key ? `${COLORS.primary[500]}15` : 'transparent',
          color: state.dashboardTab === item.key ? COLORS.primary[500] : c.textSecondary,
          fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, fontWeight: 600, textAlign: 'left',
          transition: 'all 0.2s',
        },
      },
        React.createElement('span', { style: { display: 'flex' } }, item.icon(18)),
        React.createElement('span', null, item.label),
      )),
    ),

    // Bottom section
    React.createElement('div', { style: { padding: '16px', borderTop: `1px solid ${c.border}` } },
      React.createElement('button', {
        onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'directory'}}),
        style: {
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
          borderRadius: RADIUS.md, border: 'none', cursor: 'pointer', marginBottom: '4px',
          background: 'transparent', color: c.textSecondary, fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, fontWeight: 600,
        },
      }, React.createElement('span',{style:{display:'flex'}},Icons.search(18)), 'Browse Directory'),
      React.createElement('button', {
        onClick: () => { if (isSupabaseConfigured()) supabase.auth.signOut(); dispatch({type:ACTION_TYPES.LOGOUT}); },
        style: {
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
          borderRadius: RADIUS.md, border: 'none', cursor: 'pointer',
          background: 'transparent', color: COLORS.error, fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, fontWeight: 600,
        },
      }, React.createElement('span',{style:{display:'flex'}},Icons.logout(18)), 'Log Out'),
    ),
  );

  // Mobile overlay
  if (responsive.isMobile && state.mobileSidebarOpen) {
    return React.createElement(Fragment, null,
      React.createElement('div', {
        onClick: () => dispatch({type:ACTION_TYPES.SET_MOBILE_SIDEBAR,payload:false}),
        style: { position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:49,top:'64px' },
      }),
      sidebarContent,
    );
  }
  return sidebarContent;
}

function Footer() {
  const { theme } = useTheme();
  const { dispatch } = useApp();
  const c = COLORS[theme];
  const responsive = useResponsive();

  return React.createElement('footer', {
    style: {
      background: c.surface, borderTop: `1px solid ${c.border}`,
      padding: responsive.isMobile ? '40px 20px' : '60px 40px',
    },
  },
    React.createElement('div', { style: { maxWidth: '1200px', margin: '0 auto' } },
      React.createElement('div', {
        style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '32px', marginBottom: '40px' },
      },
        // Brand
        React.createElement('div', null,
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' } },
            React.createElement('div', { style: { width: 28, height: 28, borderRadius: RADIUS.sm, background: COLORS.primary[600], position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
              React.createElement('div', { style: { width: 10, height: 10, borderRadius: '50%', border: '2px solid #fff', position: 'absolute', left: 4, top: 6 } }),
              React.createElement('div', { style: { width: 10, height: 10, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.6)', position: 'absolute', right: 4, bottom: 6 } }),
            ),
            React.createElement('span', { style: { fontFamily: FONTS.display, fontWeight: 500, fontSize: FONT_SIZES.md, color: c.text } }, 'NexaConnect'),
          ),
          React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 1.6 } },
            'Connecting NDIS participants with quality providers across Australia.'),
        ),
        // Links columns
        ...[
          { title: 'Platform', links: [['Browse Providers','directory'],['Pricing','pricing'],['For Providers','register']] },
          { title: 'Support', links: [['Help Centre','help'],['Contact Us','contact'],['NDIS Resources','ndis-resources']] },
          { title: 'Company', links: [['About','about'],['Privacy Policy','privacy'],['Terms of Service','terms'],['NDIS Code of Conduct','ndis-code-of-conduct'],['Complaints','complaints']] },
        ].map((col, i) => React.createElement('div', { key: i },
          React.createElement('h4', { style: { color: c.text, fontSize: FONT_SIZES.sm, fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' } }, col.title),
          ...col.links.map(([label, route], j) => React.createElement('button', {
            key: j,
            onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route}}),
            style: { display: 'block', background: 'none', border: 'none', color: c.textSecondary, fontSize: FONT_SIZES.sm, cursor: 'pointer', padding: '4px 0', fontFamily: FONTS.sans },
          }, label)),
        )),
      ),
      React.createElement(Divider),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' } },
        React.createElement('p', { style: { color: c.textMuted, fontSize: FONT_SIZES.xs } }, '\u00A9 2026 NexaConnect. All rights reserved.'),
        React.createElement('p', { style: { color: c.textMuted, fontSize: FONT_SIZES.xs } }, 'Made with care in Newcastle, Australia'),
      ),
    ),
  );
}

function PageShell({ children }) {
  const { theme } = useTheme();
  const { state } = useApp();
  const responsive = useResponsive();
  const c = COLORS[theme];
  const isMarketing = ['landing','pricing','login','register','directory','provider-profile','help','contact','ndis-resources','about','privacy','terms','ndis-code-of-conduct','complaints'].includes(state.route);
  const showSidebar = state.user && !isMarketing;
  const sidebarWidth = showSidebar && state.sidebarOpen && !responsive.isMobile ? 240 : 0;

  return React.createElement('div', {
    style: { minHeight: '100vh', background: c.bg, color: c.text, fontFamily: FONTS.sans, transition: 'background 0.3s' },
  },
    React.createElement(Navbar),
    showSidebar && React.createElement(Sidebar),
    React.createElement('main', {
      style: {
        marginTop: '72px', marginLeft: sidebarWidth,
        transition: 'margin-left 0.3s', minHeight: 'calc(100vh - 72px)',
        animation: 'nc-fadeIn 0.4s ease',
      },
    }, children),
  );
}


/* ═══════════════════════════════════════════════════════════════
   Phase 4: Marketing Pages
   ═══════════════════════════════════════════════════════════════ */

// ── Landing Page ──
function LandingPage() {
  const { theme } = useTheme();
  const { state, dispatch } = useApp();
  const responsive = useResponsive();
  const c = COLORS[theme];
  const { addToast } = useToast();

  const TESTIMONIALS = [
    { name: 'Sarah M.', role: 'NDIS Participant', text: 'NexaConnect made finding the right support worker so easy. I found Sunshine Support within minutes and they have been incredible!' },
    { name: 'Dr. James P.', role: 'Provider - PhysioPlus', text: 'Since joining NexaConnect, our enquiries have increased by 300%. The platform is a game-changer for disability providers.' },
    { name: 'Priya S.', role: 'Parent & Participant', text: 'Finding quality early intervention for my son was stressful until I found NexaConnect. Little Stars was exactly what we needed.' },
    { name: 'Michael R.', role: 'Provider - CareFirst', text: 'The analytics dashboard helps us understand our market. Premium features are worth every cent.' },
  ];

  const FEATURES = [
    { icon: Icons.search, title: 'Smart Search', desc: 'Find providers by service type, location, availability, and more with our intelligent search.', route: 'directory' },
    { icon: Icons.shield, title: 'Verified Providers', desc: 'Premium providers are verified for quality, giving you peace of mind.', route: 'directory' },
    { icon: Icons.star, title: 'Real Reviews', desc: 'Read genuine reviews from other NDIS participants to make informed decisions.', route: 'directory' },
    { icon: Icons.calendar, title: 'Direct Booking', desc: 'Book appointments directly with Premium providers, no phone tag needed.', route: 'register' },
    { icon: Icons.barChart, title: 'Provider Analytics', desc: 'Providers get powerful insights to understand and grow their business.', route: 'register' },
    { icon: Icons.zap, title: 'Instant Connect', desc: 'Send enquiries directly to providers and get responses within hours.', route: 'register' },
  ];

  const HOW_IT_WORKS = [
    { step: '1', title: 'Search', desc: 'Browse our directory of NDIS providers by service, location, or keyword.' },
    { step: '2', title: 'Compare', desc: 'Read reviews, check availability, and compare providers side by side.' },
    { step: '3', title: 'Connect', desc: 'Send an enquiry or book directly with your chosen provider.' },
  ];

  return React.createElement(Fragment, null,
    // Hero Section
    React.createElement('section', {
      style: {
        position: 'relative', overflow: 'hidden', minHeight: responsive.isMobile ? '80vh' : '85vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: responsive.isMobile ? '100px 20px 40px' : '100px 40px',
      },
    },
      // Background gradient
      React.createElement('div', { style: {
        position: 'absolute', inset: 0,
        background: theme === 'dark'
          ? 'radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(249,115,22,0.1) 0%, transparent 50%)'
          : COLORS.gradientHero,
      } }),
      React.createElement('div', { style: { position: 'relative', maxWidth: '1200px', width: '100%', textAlign: 'center', zIndex: 1 } },
        React.createElement('div', { style: { animation: 'nc-fadeInUp 0.8s ease' } },
          // Editorial badge pill
          React.createElement('div', { style: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '100px', background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', marginBottom: '24px', fontSize: FONT_SIZES.sm, color: c.textSecondary, fontWeight: 500 } },
            React.createElement('span', { style: { width: 8, height: 8, borderRadius: '50%', background: '#F97316', display: 'inline-block', animation: 'nc-pulse 2s ease-in-out infinite' } }),
            'Australia\'s NDIS Provider Marketplace',
          ),
          React.createElement('h1', {
            style: {
              fontSize: responsive.isMobile ? FONT_SIZES['3xl'] : FONT_SIZES['5xl'],
              fontFamily: FONTS.display, fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '24px',
              color: c.text,
            },
          },
            'Find Your Perfect', React.createElement('br'),
            React.createElement('em', { style: { color: COLORS.primary[600], fontStyle: 'italic' } }, 'NDIS Provider'),
          ),
          React.createElement('p', {
            style: {
              fontSize: responsive.isMobile ? FONT_SIZES.base : FONT_SIZES.lg, color: c.textSecondary,
              maxWidth: '580px', margin: '0 auto 32px', lineHeight: 1.7,
            },
          }, 'Browse trusted providers, read real reviews, and connect for free. The smarter way to find disability support services.'),
          React.createElement('div', { style: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' } },
            React.createElement(Button, {
              variant: 'primary', size: 'lg',
              onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'directory'}}),
              icon: Icons.search(18, '#fff'),
            }, 'Browse Providers'),
            React.createElement(Button, {
              variant: 'outline', size: 'lg',
              onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'register'}}),
            }, 'List Your Service'),
          ),
        ),
      ),
    ),

    // Stats Bar
    React.createElement('section', {
      style: {
        padding: '24px 40px', background: c.surface, borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`,
      },
    },
      React.createElement('div', {
        style: {
          maxWidth: '1000px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px',
        },
      },
        [['500+','Providers in the Hunter Region'],['2,000+','Active Participants'],['15','Service Categories'],['4.7','Average Rating']].map(([val,label],i) =>
          React.createElement('div', { key: i, style: { textAlign: 'center' } },
            React.createElement('p', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, ...gradientText() } }, val),
            React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary } }, label),
          ),
        ),
      ),
    ),

    // Features Grid
    React.createElement('section', { style: { padding: responsive.isMobile ? '60px 20px' : '130px 40px' } },
      React.createElement('div', { style: { maxWidth: '1200px', margin: '0 auto' } },
        React.createElement('div', { style: { textAlign: 'left', marginBottom: '48px', maxWidth: '500px' } },
          React.createElement('p', { style: { fontSize: FONT_SIZES.xs, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: COLORS.accent[500], marginBottom: '12px' } }, 'Platform'),
          React.createElement('h2', { style: { fontSize: responsive.isMobile ? FONT_SIZES['2xl'] : FONT_SIZES['3xl'], fontFamily: FONTS.display, fontWeight: 400, color: c.text, marginBottom: '12px' } },
            'Everything You Need'),
          React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.md } },
            'A comprehensive platform designed for NDIS participants and providers.'),
        ),
        React.createElement('div', {
          style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : responsive.isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '24px' },
        },
          FEATURES.map((f, i) => React.createElement(Card, {
            key: i, hover: true, glass: true,
            onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:f.route}}),
            style: { animation: `nc-fadeInUp ${0.3 + i * 0.1}s ease forwards`, opacity: 0, cursor: 'pointer' },
          },
            React.createElement('div', {
              style: { width: 48, height: 48, borderRadius: RADIUS.md, background: 'rgba(249,115,22,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' },
            }, f.icon(24, COLORS.accent[500])),
            React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontFamily: FONTS.display, fontWeight: 500, color: c.text, marginBottom: '8px' } }, f.title),
            React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 1.6 } }, f.desc),
          )),
        ),
      ),
    ),

    // How It Works
    React.createElement('section', { style: { padding: responsive.isMobile ? '60px 20px' : '130px 40px', background: COLORS.primary[900], position: 'relative', overflow: 'hidden' } },
      // Decorative orange radial gradient
      React.createElement('div', { style: { position: 'absolute', top: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)', pointerEvents: 'none' } }),
      React.createElement('div', { style: { maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 } },
        React.createElement('div', { style: { textAlign: 'center', marginBottom: '48px' } },
          React.createElement('h2', { style: { fontSize: responsive.isMobile ? FONT_SIZES['2xl'] : FONT_SIZES['3xl'], fontFamily: FONTS.display, fontWeight: 400, color: '#FFFFFF' } },
            'Get Connected in ', React.createElement('em', { style: { color: COLORS.accent[500], fontStyle: 'italic' } }, '3 Steps')),
        ),
        React.createElement('div', {
          style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '32px' },
        },
          HOW_IT_WORKS.map((step, i) => React.createElement('div', {
            key: i, style: { textAlign: 'center', animation: `nc-fadeInUp ${0.4 + i * 0.15}s ease forwards`, opacity: 0,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: RADIUS.lg, padding: '32px 24px', backdropFilter: 'blur(10px)' },
          },
            React.createElement('div', {
              style: {
                width: 56, height: 56, borderRadius: RADIUS.md, background: 'rgba(249,115,22,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                fontSize: FONT_SIZES.lg, fontWeight: 700, color: COLORS.accent[500],
              },
            }, step.step),
            React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontFamily: FONTS.display, fontWeight: 500, color: '#FFFFFF', marginBottom: '8px' } }, step.title),
            React.createElement('p', { style: { color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZES.sm, lineHeight: 1.6 } }, step.desc),
          )),
        ),
      ),
    ),

    // Category Showcase
    React.createElement('section', { style: { padding: responsive.isMobile ? '60px 20px' : '130px 40px' } },
      React.createElement('div', { style: { maxWidth: '1200px', margin: '0 auto' } },
        React.createElement('div', { style: { textAlign: 'left', marginBottom: '40px' } },
          React.createElement('p', { style: { fontSize: FONT_SIZES.xs, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: COLORS.accent[500], marginBottom: '12px' } }, 'Services'),
          React.createElement('h2', { style: { fontSize: responsive.isMobile ? FONT_SIZES['2xl'] : FONT_SIZES['3xl'], fontFamily: FONTS.display, fontWeight: 400, color: c.text, marginBottom: '12px' } },
            'Browse by Category'),
          React.createElement('p', { style: { color: c.textSecondary } }, '15 NDIS service categories to explore'),
        ),
        React.createElement('div', {
          style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? 'repeat(2, 1fr)' : responsive.isTablet ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: '12px' },
        },
          CATEGORIES.map((cat, i) => React.createElement(Card, {
            key: cat.id, hover: true,
            onClick: () => { dispatch({type:ACTION_TYPES.SET_SEARCH_FILTERS,payload:{category:cat.id}}); dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'directory'}}); },
            style: { textAlign: 'center', padding: '16px 12px', cursor: 'pointer' },
          },
            React.createElement('div', { style: { fontSize: '28px', marginBottom: '8px' } }, cat.icon),
            React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text } }, cat.name),
          )),
        ),
      ),
    ),

    // Pricing CTA
    React.createElement('section', { style: { padding: responsive.isMobile ? '60px 20px' : '130px 40px', background: c.surfaceAlt } },
      React.createElement('div', { style: { maxWidth: '800px', margin: '0 auto', textAlign: 'center' } },
        React.createElement('h2', { style: { fontSize: responsive.isMobile ? FONT_SIZES['2xl'] : FONT_SIZES['3xl'], fontWeight: 800, color: c.text, marginBottom: '16px' } },
          'Ready to Grow Your Business?'),
        React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.md, marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' } },
          'Join hundreds of NDIS providers already connecting with participants on NexaConnect.'),
        React.createElement('div', { style: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' } },
          React.createElement(Button, { variant: 'primary', size: 'lg', onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'pricing'}}) }, 'View Pricing'),
          React.createElement(Button, { variant: 'secondary', size: 'lg', onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'register'}}) }, 'Start Free'),
        ),
      ),
    ),

    // Testimonials
    React.createElement('section', { style: { padding: responsive.isMobile ? '60px 20px' : '130px 40px' } },
      React.createElement('div', { style: { maxWidth: '1000px', margin: '0 auto' } },
        React.createElement('div', { style: { textAlign: 'left', marginBottom: '40px' } },
          React.createElement('p', { style: { fontSize: FONT_SIZES.xs, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: COLORS.accent[500], marginBottom: '12px' } }, 'Testimonials'),
          React.createElement('h2', { style: { fontSize: responsive.isMobile ? FONT_SIZES['2xl'] : FONT_SIZES['3xl'], fontFamily: FONTS.display, fontWeight: 400, color: c.text } },
            'What People Are Saying'),
        ),
        React.createElement('div', {
          style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '24px' },
        },
          TESTIMONIALS.map((t, i) => React.createElement(Card, { key: i, glass: true },
            React.createElement(StarRating, { rating: 5, size: 14 }),
            React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 1.6, margin: '12px 0', fontStyle: 'italic' } }, `"${t.text}"`),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
              React.createElement(Avatar, { name: t.name, size: 32 }),
              React.createElement('div', null,
                React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text } }, t.name),
                React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted } }, t.role),
              ),
            ),
          )),
        ),
      ),
    ),

    // Final CTA
    React.createElement('section', {
      style: {
        padding: responsive.isMobile ? '40px 20px' : '60px 40px', textAlign: 'center',
      },
    },
      React.createElement('div', {
        style: {
          maxWidth: '1000px', margin: '0 auto', background: '#F97316', borderRadius: '24px',
          padding: responsive.isMobile ? '48px 24px' : '80px 60px', position: 'relative', overflow: 'hidden',
        },
      },
        // Decorative radial gradient overlay
        React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)', pointerEvents: 'none' } }),
        React.createElement('div', { style: { position: 'relative', zIndex: 1 } },
          React.createElement('h2', { style: { fontSize: responsive.isMobile ? FONT_SIZES['2xl'] : FONT_SIZES['4xl'], fontFamily: FONTS.display, fontWeight: 400, color: '#fff', marginBottom: '16px' } },
            'Start Your Journey Today'),
          React.createElement('p', { style: { color: 'rgba(255,255,255,0.85)', fontSize: FONT_SIZES.md, marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' } },
            'Join thousands of NDIS participants and providers already using NexaConnect.'),
          React.createElement(Button, {
            variant: 'secondary', size: 'lg',
            onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'register'}}),
            style: { background: '#fff', color: '#F97316', border: 'none', fontWeight: 600 },
          }, 'Get Started Free'),
        ),
      ),
    ),

    React.createElement(Footer),
  );
}

// ── Pricing Page ──
function PricingPage() {
  const { theme } = useTheme();
  const { state, dispatch } = useApp();
  const responsive = useResponsive();
  const c = COLORS[theme];

  const FAQ = [
    { q: 'Can I change my plan later?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.' },
    { q: 'Is there a contract or commitment?', a: 'No contracts! All plans are month-to-month. Cancel anytime with no penalties.' },
    { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, debit cards, and bank transfers for annual plans.' },
    { q: 'Do participants pay anything?', a: 'No! NexaConnect is completely free for NDIS participants. Only providers pay for listing services.' },
    { q: 'What happens when I hit the enquiry limit on Starter?', a: 'You will still receive enquiries but they will be queued. Upgrade to Professional for unlimited enquiries.' },
    { q: 'Can I get a refund?', a: 'We offer a 14-day money-back guarantee on all paid plans. No questions asked.' },
  ];

  return React.createElement(Fragment, null,
    React.createElement('section', {
      style: { padding: responsive.isMobile ? '100px 20px 60px' : '120px 40px 80px', textAlign: 'center' },
    },
      React.createElement(Badge, { variant: 'default', style: { marginBottom: '16px' } }, 'Pricing'),
      React.createElement('h1', { style: { fontSize: responsive.isMobile ? FONT_SIZES['2xl'] : FONT_SIZES['4xl'], fontWeight: 900, color: c.text, marginBottom: '16px' } },
        'Simple, Transparent Pricing'),
      React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.md, maxWidth: '500px', margin: '0 auto 32px' } },
        'Choose the plan that fits your business. Free for participants, always.'),

      // Billing toggle
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '48px' } },
        React.createElement('span', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: state.billingCycle === 'monthly' ? c.text : c.textMuted } }, 'Monthly'),
        React.createElement(Toggle, {
          checked: state.billingCycle === 'annual',
          onChange: (v) => dispatch({type:ACTION_TYPES.SET_BILLING_CYCLE,payload:v?'annual':'monthly'}),
        }),
        React.createElement('span', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: state.billingCycle === 'annual' ? c.text : c.textMuted } }, 'Annual'),
        React.createElement(Badge, { variant: 'success', size: 'xs' }, 'Save 20%'),
      ),

      // Pricing Cards
      React.createElement('div', {
        style: {
          display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '24px', maxWidth: '1000px', margin: '0 auto',
        },
      },
        PLANS.map((plan, i) => {
          const price = state.billingCycle === 'annual' ? plan.priceAnnual : plan.price;
          const isPopular = plan.popular;
          return React.createElement('div', {
            key: plan.id,
            style: {
              ...cardStyle(theme), padding: '32px 24px', position: 'relative',
              border: isPopular ? `2px solid ${COLORS.primary[500]}` : `1px solid ${c.border}`,
              transform: isPopular && !responsive.isMobile ? 'scale(1.05)' : undefined,
              zIndex: isPopular ? 1 : 0,
            },
          },
            isPopular && React.createElement('div', {
              style: {
                position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                background: COLORS.gradientPrimary, color: '#fff', padding: '4px 16px',
                borderRadius: RADIUS.full, fontSize: FONT_SIZES.xs, fontWeight: 700,
              },
            }, 'Most Popular'),
            React.createElement('h3', { style: { fontSize: FONT_SIZES.xl, fontWeight: 800, color: c.text, marginBottom: '8px' } }, plan.name),
            React.createElement('div', { style: { marginBottom: '24px' } },
              React.createElement('span', { style: { fontSize: FONT_SIZES['4xl'], fontWeight: 900, color: c.text } },
                price === 0 ? 'Free' : `$${price}`),
              price > 0 && React.createElement('span', { style: { fontSize: FONT_SIZES.sm, color: c.textMuted } }, '/mo'),
            ),
            React.createElement(Button, {
              variant: isPopular ? 'primary' : 'secondary', fullWidth: true,
              onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'register'}}),
              style: { marginBottom: '24px' },
            }, price === 0 ? 'Get Started Free' : 'Start Free Trial'),
            React.createElement(Divider),
            React.createElement('ul', { style: { listStyle: 'none', textAlign: 'left' } },
              plan.features.map((f, j) => React.createElement('li', {
                key: j, style: { display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' },
              },
                React.createElement('span', { style: { color: COLORS.success, marginTop: '2px', flexShrink: 0 } }, Icons.check(16, COLORS.success)),
                React.createElement('span', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary } }, f),
              )),
            ),
          );
        }),
      ),
    ),

    // FAQ
    React.createElement('section', { style: { padding: responsive.isMobile ? '60px 20px' : '130px 40px', background: c.surfaceAlt } },
      React.createElement('div', { style: { maxWidth: '700px', margin: '0 auto' } },
        React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, textAlign: 'center', marginBottom: '40px' } },
          'Frequently Asked Questions'),
        FAQ.map((item, i) => React.createElement(Card, {
          key: i,
          onClick: () => dispatch({type:ACTION_TYPES.TOGGLE_FAQ,payload:i}),
          style: { marginBottom: '8px', cursor: 'pointer', padding: '16px 20px' },
        },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('h4', { style: { fontSize: FONT_SIZES.base, fontWeight: 600, color: c.text } }, item.q),
            React.createElement('span', { style: { color: c.textMuted, transition: 'transform 0.2s', transform: state.faqOpen[i] ? 'rotate(180deg)' : 'none' } },
              Icons.chevronDown(18)),
          ),
          state.faqOpen[i] && React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm, marginTop: '12px', lineHeight: 1.6 } }, item.a),
        )),
      ),
    ),
    React.createElement(Footer),
  );
}

// ── Login Page ──
function LoginPage() {
  const { theme } = useTheme();
  const { state, dispatch } = useApp();
  const responsive = useResponsive();
  const c = COLORS[theme];
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const demoLogin = () => {
    // Check admin
    if (email === ADMIN_DATA.email && password === ADMIN_DATA.password) {
      const user = { ...ADMIN_DATA };
      dispatch({type:ACTION_TYPES.SET_USER,payload:user});
      dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'admin-dashboard'}});
      dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload:'overview'});
      addToast('Welcome back, Admin!', 'success');
      return true;
    }
    // Check providers
    const provider = state.providers.find(p => p.email === email && p.password === password);
    if (provider) {
      const user = { id: provider.id, name: provider.name, email: provider.email, role: 'provider', tier: provider.tier };
      dispatch({type:ACTION_TYPES.SET_USER,payload:user});
      dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'provider-dashboard'}});
      dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload:'overview'});
      addToast(`Welcome back, ${provider.name}!`, 'success');
      return true;
    }
    // Check participants
    const participant = state.participants.find(p => p.email === email && p.password === password);
    if (participant) {
      const user = { ...participant, role: 'participant' };
      dispatch({type:ACTION_TYPES.SET_USER,payload:user});
      dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'participant-dashboard'}});
      dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload:'overview'});
      addToast(`Welcome back, ${participant.name}!`, 'success');
      return true;
    }
    return false;
  };

  const handleLogin = async () => {
    setError('');
    // Use demo login only when Supabase is not configured (pure demo mode)
    if (!isSupabaseConfigured()) {
      if (demoLogin()) return;
      setError('Invalid email or password. Try sunshine@provider.com.au / password');
      return;
    }

    // Supabase auth
      setLoading(true);
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }
        // Look up user profile
        const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', data.user.id).single();
        const role = profile?.role || 'participant';
        const user = { id: data.user.id, name: profile?.name || data.user.email, email: data.user.email, role, tier: profile?.tier || 'starter' };
        dispatch({type:ACTION_TYPES.SET_USER,payload:user});
        dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route: role === 'admin' ? 'admin-dashboard' : role === 'provider' ? 'provider-dashboard' : 'participant-dashboard'}});
        dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload:'overview'});

        // Load provider/participant record from DB
        if (role === 'provider') {
          const dbProvider = await db.fetchProviderByUserId(data.user.id);
          if (dbProvider) {
            dispatch({type:ACTION_TYPES.UPDATE_PROVIDER_PROFILE,payload:dbProvider});
          }
        } else if (role === 'participant') {
          const dbParticipant = await db.fetchParticipant(data.user.id);
          if (dbParticipant) {
            dispatch({type:ACTION_TYPES.UPDATE_PARTICIPANT_PROFILE,payload:dbParticipant});
          }
        }

        addToast(`Welcome back, ${user.name}!`, 'success');
      } catch (err) {
        setError('Login failed. Please try again.');
      }
      setLoading(false);
  };

  return React.createElement('div', {
    style: {
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '96px 20px 40px',
    },
  },
    React.createElement(Card, {
      style: { width: '100%', maxWidth: '420px', padding: '40px 32px', animation: 'nc-fadeIn 0.5s ease' },
    },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: '32px' } },
        React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '8px' } }, 'Welcome Back'),
        React.createElement('p', { style: { color: c.textSecondary } }, 'Log in to your NexaConnect account'),
      ),
      error && React.createElement('div', { style: { padding: '10px 14px', borderRadius: RADIUS.md, background: `${COLORS.error}15`, color: COLORS.error, fontSize: FONT_SIZES.sm, marginBottom: '16px' } }, error),
      React.createElement(Input, { label: 'Email', type: 'email', value: email, onChange: setEmail, placeholder: 'you@example.com', icon: Icons.mail(16) }),
      React.createElement(Input, { label: 'Password', type: 'password', value: password, onChange: setPassword, placeholder: 'Enter password' }),
      React.createElement(Button, { variant: 'primary', fullWidth: true, onClick: handleLogin, style: { marginTop: '8px' } }, 'Log In'),
      React.createElement('div', { style: { textAlign: 'center', marginTop: '20px' } },
        React.createElement('span', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm } }, "Don't have an account? "),
        React.createElement('button', {
          onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'register'}}),
          style: { background: 'none', border: 'none', color: COLORS.primary[500], cursor: 'pointer', fontWeight: 600, fontSize: FONT_SIZES.sm, fontFamily: FONTS.sans },
        }, 'Sign Up'),
      ),
      React.createElement(Divider, { style: { margin: '20px 0' } }),
      React.createElement('div', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, textAlign: 'center' } },
        React.createElement('p', { style: { fontWeight: 600, marginBottom: '4px' } }, 'Demo Accounts:'),
        React.createElement('p', null, 'Admin: admin@nexaconnect.com.au'),
        React.createElement('p', null, 'Provider: sunshine@provider.com.au'),
        React.createElement('p', null, 'Participant: sarah@participant.com.au'),
        React.createElement('p', { style: { marginTop: '4px' } }, 'Password: password'),
      ),
    ),
  );
}

// ── Register Page ──
function RegisterPage() {
  const { theme } = useTheme();
  const { state, dispatch } = useApp();
  const responsive = useResponsive();
  const c = COLORS[theme];
  const { addToast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', suburb: '', businessName: '', abn: '', category: '' });
  const [loading, setLoading] = useState(false);
  const update = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

  const localRegister = (role, supabaseUserId) => {
    if (role === 'provider') {
      const newProvider = {
        id: supabaseUserId || ('p' + (state.providers.length + 1)), name: formData.businessName || formData.name,
        email: formData.email, password: formData.password, tier: 'starter', verified: false,
        categories: formData.category ? [formData.category] : ['daily-living'],
        suburb: formData.suburb || 'Newcastle', state: 'NSW', postcode: '2300',
        phone: formData.phone || '', website: '',
        description: '', shortDescription: 'New provider on NexaConnect',
        photos: [], rating: 0, reviewCount: 0, responseRate: 0, responseTime: 'N/A',
        waitTime: 'TBA', planTypes: ['Plan Managed'],
        availability: { mon:'9am-5pm',tue:'9am-5pm',wed:'9am-5pm',thu:'9am-5pm',fri:'9am-5pm',sat:'Closed',sun:'Closed' },
        serviceAreas: [formData.suburb || 'Newcastle'], founded: 2026, teamSize: '1',
        languages: ['English'], features: [],
        viewsThisMonth: 0, enquiriesThisMonth: 0, bookingsThisMonth: 0,
      };
      dispatch({type:ACTION_TYPES.UPDATE_PROVIDER_PROFILE,payload:newProvider});
      const user = { id: newProvider.id, name: newProvider.name, email: newProvider.email, role: 'provider', tier: 'starter' };
      dispatch({type:ACTION_TYPES.SET_USER,payload:user});
      dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'provider-dashboard'}});
      dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload:'overview'});
      addToast('Welcome to NexaConnect! Set up your profile to get started.', 'success');
    } else {
      const newParticipant = {
        id: supabaseUserId || ('u' + (state.participants.length + 1)), name: formData.name,
        email: formData.email, password: formData.password, role: 'participant',
        suburb: formData.suburb || 'Newcastle', state: 'NSW',
        ndisNumber: '', planType: 'Plan Managed', goals: [], categories: [], favourites: [],
      };
      const user = { ...newParticipant };
      dispatch({type:ACTION_TYPES.SET_USER,payload:user});
      dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'participant-dashboard'}});
      dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload:'overview'});
      addToast('Welcome to NexaConnect! Start browsing providers.', 'success');
    }
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    if (formData.password.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    // Try Supabase registration if configured
    if (isSupabaseConfigured()) {
      setLoading(true);
      try {
        const { data, error: authError } = await supabase.auth.signUp({ email: formData.email, password: formData.password });
        if (authError) {
          addToast(authError.message, 'error');
          setLoading(false);
          return;
        }
        // Insert user profile
        const role = state.registerRole;
        await supabase.from('user_profiles').insert({
          id: data.user.id,
          email: formData.email,
          name: formData.name,
          role: role,
          tier: 'starter',
        });

        // Insert into providers or participants table
        if (role === 'provider') {
          await db.createProvider(data.user.id, {
            name: formData.businessName || formData.name,
            email: formData.email,
            tier: 'starter',
            categories: formData.category ? [formData.category] : ['daily-living'],
            suburb: formData.suburb || 'Newcastle',
            state: 'NSW',
            postcode: '2300',
            phone: formData.phone || '',
            serviceAreas: [formData.suburb || 'Newcastle'],
          });
        } else {
          await db.createParticipant(data.user.id, {
            name: formData.name,
            email: formData.email,
            suburb: formData.suburb || 'Newcastle',
            state: 'NSW',
          });
        }

        addToast('Account created! Check your email for confirmation.', 'success');
        // Also do local registration so the app works immediately
        localRegister(role, data.user.id);
      } catch (err) {
        addToast('Registration failed. Please try again.', 'error');
      }
      setLoading(false);
      return;
    }

    // Fallback to local-only registration
    localRegister(state.registerRole);
  };

  return React.createElement('div', {
    style: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '96px 20px 40px' },
  },
    React.createElement(Card, {
      style: { width: '100%', maxWidth: '480px', padding: '40px 32px', animation: 'nc-fadeIn 0.5s ease' },
    },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: '32px' } },
        React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '8px' } }, 'Create Account'),
        React.createElement('p', { style: { color: c.textSecondary } }, 'Join NexaConnect today'),
      ),

      // Role selector
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' } },
        ['participant', 'provider'].map(role => React.createElement('button', {
          key: role,
          onClick: () => dispatch({type:ACTION_TYPES.SET_REGISTER_ROLE,payload:role}),
          style: {
            padding: '14px', borderRadius: RADIUS.md, cursor: 'pointer',
            border: `2px solid ${state.registerRole === role ? COLORS.primary[500] : c.border}`,
            background: state.registerRole === role ? `${COLORS.primary[500]}10` : 'transparent',
            fontFamily: FONTS.sans, textAlign: 'center', transition: 'all 0.2s',
          },
        },
          React.createElement('div', { style: { fontSize: '24px', marginBottom: '4px' } }, role === 'participant' ? Icons.user(24, state.registerRole === role ? COLORS.primary[500] : c.textMuted) : Icons.briefcase(24, state.registerRole === role ? COLORS.primary[500] : c.textMuted)),
          React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: state.registerRole === role ? COLORS.primary[500] : c.textSecondary } },
            role === 'participant' ? 'Participant' : 'Provider'),
          React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted } },
            role === 'participant' ? 'Browse & connect free' : 'List your services'),
        )),
      ),

      React.createElement(Input, { label: state.registerRole === 'provider' ? 'Contact Name *' : 'Full Name *', value: formData.name, onChange: v => update('name',v), placeholder: 'Your full name' }),
      state.registerRole === 'provider' && React.createElement(Input, { label: 'Business Name *', value: formData.businessName, onChange: v => update('businessName',v), placeholder: 'Your business name' }),
      React.createElement(Input, { label: 'Email *', type: 'email', value: formData.email, onChange: v => update('email',v), placeholder: 'you@example.com' }),
      React.createElement(Input, { label: 'Password *', type: 'password', value: formData.password, onChange: v => update('password',v), placeholder: 'Min 8 characters' }),
      React.createElement(Input, { label: 'Phone', value: formData.phone, onChange: v => update('phone',v), placeholder: '04XX XXX XXX' }),
      React.createElement(Select, { label: 'Suburb', value: formData.suburb, onChange: v => update('suburb',v),
        options: [{value:'',label:'Select suburb'},...SUBURBS.map(s => ({value:s,label:s}))] }),
      state.registerRole === 'provider' && React.createElement(Input, { label: 'ABN', value: formData.abn, onChange: v => update('abn',v), placeholder: 'XX XXX XXX XXX' }),
      state.registerRole === 'provider' && React.createElement(Select, { label: 'Primary Category', value: formData.category, onChange: v => update('category',v),
        options: [{value:'',label:'Select category'},...CATEGORIES.map(c => ({value:c.id,label:c.name}))] }),

      React.createElement(Button, { variant: 'primary', fullWidth: true, onClick: handleRegister, disabled: loading, style: { marginTop: '8px' } },
        loading ? React.createElement(Spinner, { size: 16, color: '#fff' }) :
        state.registerRole === 'provider' ? 'Create Provider Account' : 'Create Account'),
      React.createElement('div', { style: { textAlign: 'center', marginTop: '20px' } },
        React.createElement('span', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm } }, 'Already have an account? '),
        React.createElement('button', {
          onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'login'}}),
          style: { background: 'none', border: 'none', color: COLORS.primary[500], cursor: 'pointer', fontWeight: 600, fontSize: FONT_SIZES.sm, fontFamily: FONTS.sans },
        }, 'Log In'),
      ),
    ),
  );
}


/* ═══════════════════════════════════════════════════════════════
   Phase 5: Directory & Provider Profiles
   ═══════════════════════════════════════════════════════════════ */

// ── Provider Card ──
function ProviderCard({ provider, onView, onFavourite, isFavourite, onCompare, isInCompare }) {
  const { theme } = useTheme();
  const { state } = useApp();
  const c = COLORS[theme];
  const tierColors = { premium: '#F59E0B', professional: COLORS.primary[500], starter: c.textMuted };
  const tierLabels = { premium: 'Premium', professional: 'Professional', starter: 'Starter' };

  return React.createElement(Card, {
    hover: true,
    onClick: () => onView(provider.id),
    style: {
      cursor: 'pointer', position: 'relative', overflow: 'hidden',
      border: isInCompare ? `2px solid ${COLORS.primary[500]}` : undefined,
      transition: 'all 0.2s',
    },
  },
    React.createElement('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: tierColors[provider.tier] || c.textMuted } }),

    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' } },
      React.createElement('div', { style: { display: 'flex', gap: '12px', alignItems: 'center', flex: 1 } },
        React.createElement(Avatar, { name: provider.name, size: 48 }),
        React.createElement('div', { style: { flex: 1, minWidth: 0 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' } },
            React.createElement('h3', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, provider.name),
            provider.verified && Icons.verified(16, COLORS.accent[500]),
            provider.workerScreeningStatus === 'verified' && React.createElement('span', { title: 'NDIS Worker Screening Verified' }, Icons.shieldCheck(15, COLORS.success)),
          ),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' } },
            React.createElement(Badge, { variant: provider.tier, size: 'xs' }, tierLabels[provider.tier]),
            React.createElement('span', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted } }, provider.suburb),
          ),
        ),
      ),
      React.createElement('div', { style: { display: 'flex', gap: '4px', alignItems: 'center' } },
        onCompare && React.createElement('button', {
          onClick: (e) => { e.stopPropagation(); onCompare(provider.id); },
          title: isInCompare ? 'Remove from compare' : 'Add to compare',
          style: {
            background: isInCompare ? COLORS.primary[500] : 'none',
            border: `1px solid ${isInCompare ? COLORS.primary[500] : c.border}`,
            borderRadius: RADIUS.sm, cursor: 'pointer', padding: '4px 8px',
            color: isInCompare ? '#fff' : c.textSecondary,
            fontSize: FONT_SIZES.xs, fontWeight: 600, fontFamily: FONTS.sans,
            display: 'flex', alignItems: 'center', gap: '3px',
          },
        }, Icons.gitCompare(13, isInCompare ? '#fff' : c.textSecondary), isInCompare ? 'Added' : 'Compare'),
        onFavourite && React.createElement('button', {
          onClick: (e) => { e.stopPropagation(); onFavourite(provider.id); },
          style: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: isFavourite ? COLORS.error : c.textMuted },
        }, isFavourite ? Icons.heartFilled(18, COLORS.error) : Icons.heart(18)),
      ),
    ),

    React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary, lineHeight: 1.5, marginBottom: '12px',
      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } },
      provider.tier === 'starter' ? provider.shortDescription.slice(0, 200) : provider.shortDescription),

    React.createElement('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' } },
      provider.categories.slice(0, 3).map(catId => {
        const cat = CATEGORIES.find(c => c.id === catId);
        return cat ? React.createElement(Badge, { key: catId, size: 'xs' }, cat.name) : null;
      }),
    ),

    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: `1px solid ${c.border}` } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
        React.createElement(StarRating, { rating: provider.rating, size: 14 }),
        React.createElement('span', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, marginLeft: '4px' } }, `(${provider.reviewCount})`),
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        React.createElement('span', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, display: 'flex', alignItems: 'center', gap: '3px' } },
          Icons.clock(12, c.textMuted), calcResponseTime(provider, state.enquiries || [])),
        React.createElement('span', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, display: 'flex', alignItems: 'center', gap: '3px' } },
          Icons.mapPin(12, c.textMuted), provider.waitTime),
      ),
    ),
  );
}

function CompareModal({ providerIds, onClose, onView }) {
  const { theme } = useTheme();
  const { state } = useApp();
  const c = COLORS[theme];
  const providers = providerIds.map(id => state.providers.find(p => p.id === id)).filter(Boolean);

  const rows = [
    { label: 'Rating', render: (p) => React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' } },
        React.createElement(StarRating, { rating: p.rating, size: 14 }),
        React.createElement('span', { style: { fontSize: FONT_SIZES.sm, fontWeight: 700, color: c.text, marginLeft: '4px' } }, p.rating.toFixed(1))) },
    { label: 'Reviews', render: (p) => React.createElement('span', { style: { fontSize: FONT_SIZES.sm, fontWeight: 700, color: c.text } }, p.reviewCount + ' reviews') },
    { label: 'Wait Time', render: (p) => React.createElement('span', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary } }, p.waitTime) },
    { label: 'Response Time', render: (p) => React.createElement('span', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary } }, p.responseTime) },
    { label: 'Response Rate', render: (p) => React.createElement('span', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: p.responseRate >= 95 ? COLORS.success : p.responseRate >= 80 ? COLORS.warning : COLORS.error } }, p.responseRate + '%') },
    { label: 'Verified', render: (p) => p.verified
        ? React.createElement(Badge, { variant: 'success', size: 'xs' }, 'Verified')
        : React.createElement(Badge, { variant: 'default', size: 'xs' }, 'Not verified') },
    { label: 'Tier', render: (p) => React.createElement(Badge, { variant: p.tier, size: 'xs' }, p.tier.charAt(0).toUpperCase() + p.tier.slice(1)) },
    { label: 'Services', render: (p) => React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' } },
        (p.categories || []).slice(0, 4).map(catId => {
          const cat = CATEGORIES.find(ct => ct.id === catId);
          return cat ? React.createElement(Badge, { key: catId, size: 'xs', style: { margin: '1px' } }, cat.name) : null;
        })
      ) },
    { label: 'Plan Types', render: (p) => React.createElement('div', { style: { fontSize: FONT_SIZES.xs, color: c.textSecondary, lineHeight: 1.6 } }, (p.planTypes || []).join(', ')) },
    { label: 'Location', render: (p) => React.createElement('span', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary } }, p.suburb + ', ' + (p.state || 'NSW')) },
  ];

  return React.createElement('div', {
    onClick: onClose,
    style: { position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS[theme].overlay, animation: 'nc-fadeIn 0.2s ease' },
  },
    React.createElement('div', {
      onClick: (e) => e.stopPropagation(),
      style: {
        width: '90vw', maxWidth: '900px', maxHeight: '88vh', overflowY: 'auto',
        padding: 0, animation: 'nc-scaleIn 0.3s ease', background: c.surface,
        borderRadius: RADIUS.lg, boxShadow: c.cardShadow, border: `1px solid ${c.border}`,
      },
    },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${c.border}` } },
        React.createElement('h3', { style: { fontSize: FONT_SIZES.xl, fontWeight: 700, color: c.text } }, 'Provider Comparison'),
        React.createElement('button', { onClick: onClose, style: { background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: '4px' } }, Icons.x()),
      ),
      React.createElement('div', { style: { overflowX: 'auto' } },
        React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', fontFamily: FONTS.sans } },
          React.createElement('thead', null,
            React.createElement('tr', null,
              React.createElement('th', { style: { padding: '16px 20px', textAlign: 'left', fontSize: FONT_SIZES.xs, color: c.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', width: '140px', borderBottom: `1px solid ${c.border}`, background: c.surfaceAlt } }, 'Feature'),
              ...providers.map(p => React.createElement('th', { key: p.id, style: { padding: '16px 12px', textAlign: 'center', borderBottom: `1px solid ${c.border}`, minWidth: '200px', background: c.surfaceAlt } },
                React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' } },
                  React.createElement(Avatar, { name: p.name, size: 44 }),
                  React.createElement('div', null,
                    React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 700, color: c.text, marginBottom: '2px' } }, p.name),
                    p.verified && React.createElement('div', { style: { display: 'flex', justifyContent: 'center' } }, Icons.verified(12, COLORS.accent[500])),
                  ),
                  React.createElement(Button, { variant: 'primary', size: 'sm', onClick: () => { onView(p.id); onClose(); } }, 'View Profile'),
                ),
              )),
            ),
          ),
          React.createElement('tbody', null,
            rows.map((row, i) => React.createElement('tr', { key: i, style: { background: i % 2 === 0 ? 'transparent' : (theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)') } },
              React.createElement('td', { style: { padding: '12px 20px', fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.textSecondary, borderBottom: `1px solid ${c.border}` } }, row.label),
              ...providers.map(p => React.createElement('td', { key: p.id, style: { padding: '12px', textAlign: 'center', borderBottom: `1px solid ${c.border}` } },
                row.render(p),
              )),
            )),
          ),
        ),
      ),
    ),
  );
}

function CompareBar({ compareIds, onCompare, onClear }) {
  const { theme } = useTheme();
  const { state, dispatch } = useApp();
  const c = COLORS[theme];
  const [showModal, setShowModal] = useState(false);
  const providers = compareIds.map(id => state.providers.find(p => p.id === id)).filter(Boolean);

  if (compareIds.length === 0) return null;

  return React.createElement(Fragment, null,
    React.createElement('div', {
      style: {
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500,
        background: c.surface, borderTop: `2px solid ${COLORS.primary[500]}`,
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px', animation: 'nc-slideUp 0.3s ease', boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
        flexWrap: 'wrap',
      },
    },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' } },
        React.createElement('span', { style: { fontSize: FONT_SIZES.sm, fontWeight: 700, color: c.text } }, 'Comparing:'),
        providers.map(p => React.createElement('div', { key: p.id, style: { display: 'flex', alignItems: 'center', gap: '6px', background: c.surfaceAlt, borderRadius: RADIUS.full, padding: '4px 10px 4px 6px', border: `1px solid ${c.border}` } },
          React.createElement(Avatar, { name: p.name, size: 22 }),
          React.createElement('span', { style: { fontSize: FONT_SIZES.xs, fontWeight: 600, color: c.text } }, p.name),
          React.createElement('button', {
            onClick: () => onCompare(p.id),
            style: { background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, display: 'flex', padding: '0 0 0 2px' },
          }, Icons.x(12)),
        )),
        compareIds.length < 3 && React.createElement('span', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, fontStyle: 'italic' } },
          compareIds.length === 1 ? 'Add 1 more to compare' : 'Add up to 1 more'),
      ),
      React.createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
        React.createElement(Button, { variant: 'ghost', size: 'sm', onClick: onClear }, 'Clear All'),
        React.createElement(Button, {
          variant: 'primary', size: 'sm',
          onClick: () => setShowModal(true),
          disabled: compareIds.length < 2,
          icon: Icons.gitCompare(15, '#fff'),
        }, `Compare (${compareIds.length})`),
      ),
    ),
    showModal && React.createElement(CompareModal, {
      providerIds: compareIds,
      onClose: () => setShowModal(false),
      onView: (id) => { dispatch({type:ACTION_TYPES.SET_SELECTED_PROVIDER,payload:id}); dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'provider-profile',params:{providerId:id}}}); },
    }),
  );
}


function DirectoryPage() {
  const { theme } = useTheme();
  const { state, dispatch } = useApp();
  const responsive = useResponsive();
  const c = COLORS[theme];
  const [showFilters, setShowFilters] = useState(!responsive.isMobile);
  const compareIds = state.compareProviders || [];
  const toggleCompare = (id) => dispatch({ type: ACTION_TYPES.TOGGLE_COMPARE_PROVIDER, payload: id });

  const results = useMemo(() =>
    rankProviders(state.providers, state.searchQuery, state.searchFilters),
    [state.providers, state.searchQuery, state.searchFilters]
  );

  const participant = state.user && state.user.role === 'participant' ? state.participants.find(p => p.id === state.user.id) : null;

  const viewProvider = (id) => {
    dispatch({type:ACTION_TYPES.SET_SELECTED_PROVIDER,payload:id});
    dispatch({type:ACTION_TYPES.INCREMENT_VIEWS,payload:id});
    dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'provider-profile',params:{providerId:id}}});
  };

  const toggleFav = (id) => {
    if (!state.user || state.user.role !== 'participant') return;
    dispatch({type:ACTION_TYPES.TOGGLE_FAVOURITE,payload:id});
  };

  const activeFilterCount = Object.values(state.searchFilters).filter(v => v && v !== 0 && v !== false).length;

  return React.createElement('div', { style: { padding: responsive.isMobile ? '96px 16px 40px' : '96px 32px 40px', maxWidth: '1400px', margin: '0 auto' } },
    // Header
    React.createElement('div', { style: { marginBottom: '24px' } },
      React.createElement('h1', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '8px' } }, 'Browse Providers'),
      React.createElement('p', { style: { color: c.textSecondary } }, `${results.length} providers found`),
    ),

    // Search bar
    React.createElement('div', { style: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' } },
      React.createElement('div', { style: { flex: 1, minWidth: '250px' } },
        React.createElement(SearchBar, {
          value: state.searchQuery,
          onChange: (v) => dispatch({type:ACTION_TYPES.SET_SEARCH_QUERY,payload:v}),
          placeholder: 'Search providers, services, suburbs...',
        }),
      ),
      React.createElement(Button, {
        variant: 'secondary', size: 'sm',
        onClick: () => setShowFilters(!showFilters),
        icon: Icons.filter(16),
      }, `Filters${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`),
      activeFilterCount > 0 && React.createElement(Button, {
        variant: 'ghost', size: 'sm',
        onClick: () => dispatch({type:ACTION_TYPES.CLEAR_FILTERS}),
      }, 'Clear All'),
    ),

    React.createElement('div', { style: { display: 'flex', gap: '24px' } },
      // Filter sidebar
      showFilters && React.createElement(Card, {
        style: {
          width: responsive.isMobile ? '100%' : '260px', flexShrink: 0, padding: '20px',
          position: responsive.isMobile ? 'static' : 'sticky', top: '96px', alignSelf: 'flex-start',
          maxHeight: responsive.isMobile ? 'none' : 'calc(100vh - 160px)', overflowY: 'auto',
        },
      },
        React.createElement('h3', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text, marginBottom: '16px' } }, 'Filters'),

        React.createElement(Select, { label: 'Category', value: state.searchFilters.category,
          onChange: v => dispatch({type:ACTION_TYPES.SET_SEARCH_FILTERS,payload:{category:v}}),
          options: [{value:'',label:'All categories'},...CATEGORIES.map(c => ({value:c.id,label:c.name}))] }),

        React.createElement(Select, { label: 'Suburb', value: state.searchFilters.suburb,
          onChange: v => dispatch({type:ACTION_TYPES.SET_SEARCH_FILTERS,payload:{suburb:v}}),
          options: [{value:'',label:'All suburbs'},...SUBURBS.map(s => ({value:s,label:s}))] }),

        React.createElement(Select, { label: 'Max Wait Time', value: state.searchFilters.waitTime,
          onChange: v => dispatch({type:ACTION_TYPES.SET_SEARCH_FILTERS,payload:{waitTime:v}}),
          options: [{value:'',label:'Any wait time'},{value:'immediate',label:'Immediate'},{value:'1-week',label:'Within 1 week'},{value:'2-weeks',label:'Within 2 weeks'},{value:'1-month',label:'Within 1 month'}] }),

        React.createElement(Select, { label: 'Plan Type', value: state.searchFilters.planType,
          onChange: v => dispatch({type:ACTION_TYPES.SET_SEARCH_FILTERS,payload:{planType:v}}),
          options: [{value:'',label:'All plan types'},{value:'Agency',label:'Agency Managed'},{value:'Plan Managed',label:'Plan Managed'},{value:'Self Managed',label:'Self Managed'}] }),

        React.createElement('div', { style: { marginBottom: '16px' } },
          React.createElement('label', { style: { display: 'block', fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text, marginBottom: '8px' } }, 'Minimum Rating'),
          React.createElement('div', { style: { display: 'flex', gap: '4px' } },
            [0,3,3.5,4,4.5].map(r => React.createElement(FilterChip, {
              key: r, label: r === 0 ? 'Any' : `${r}+`, active: state.searchFilters.minRating === r,
              onClick: () => dispatch({type:ACTION_TYPES.SET_SEARCH_FILTERS,payload:{minRating:r}}),
            })),
          ),
        ),

        React.createElement(Toggle, {
          checked: state.searchFilters.verifiedOnly,
          onChange: v => dispatch({type:ACTION_TYPES.SET_SEARCH_FILTERS,payload:{verifiedOnly:v}}),
          label: 'Verified only',
        }),
      ),

      // Results grid
      React.createElement('div', { style: { flex: 1 } },
        results.length === 0 ? React.createElement(EmptyState, {
          icon: Icons.search(48, c.textMuted),
          title: 'No providers found',
          description: 'Try adjusting your search or filters',
          action: React.createElement(Button, { variant: 'secondary', onClick: () => dispatch({type:ACTION_TYPES.CLEAR_FILTERS}) }, 'Clear Filters'),
        }) :
        React.createElement('div', {
          style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : responsive.isTablet || (showFilters && !responsive.isWide) ? '1fr' : 'repeat(2, 1fr)', gap: '16px' },
        },
          results.map(p => React.createElement(ProviderCard, {
            key: p.id, provider: p, onView: viewProvider,
            onFavourite: state.user?.role === 'participant' ? toggleFav : null,
            isFavourite: participant?.favourites?.includes(p.id),
            onCompare: toggleCompare,
            isInCompare: compareIds.includes(p.id),
          })),
        ),
      ),
    ),
    compareIds.length > 0 && React.createElement('div', { style: { height: '80px' } }),
    React.createElement(CompareBar, {
      compareIds,
      onCompare: toggleCompare,
      onClear: () => dispatch({ type: ACTION_TYPES.CLEAR_COMPARE }),
    }),
  );
}

// ── Provider Profile Page ──
function ProviderProfilePage() {
  const { theme } = useTheme();
  const { state, dispatch } = useApp();
  const responsive = useResponsive();
  const c = COLORS[theme];
  const { addToast } = useToast();

  const providerId = state.routeParams.providerId || state.selectedProviderId;
  const provider = state.providers.find(p => p.id === providerId);
  const reviews = state.reviews.filter(r => r.providerId === providerId);
  const [activeTab, setActiveTab] = useState('about');
  const [enquiryText, setEnquiryText] = useState('');
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({ service: '', date: '', time: '', notes: '' });
  const [reviewData, setReviewData] = useState({ rating: 5, text: '' });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({ reason: '', notes: '' });

  if (!provider) return React.createElement(EmptyState, { title: 'Provider not found', action: React.createElement(Button, { onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'directory'}}) }, 'Back to Directory') });

  const participant = state.user?.role === 'participant' ? state.participants.find(p => p.id === state.user.id) : null;
  const isFav = participant?.favourites?.includes(provider.id);
  const tierColors = { premium: '#F59E0B', professional: COLORS.primary[500], starter: c.textMuted };

  const sendEnquiry = async () => {
    if (!state.user || !enquiryText.trim()) { addToast('Please log in and write a message', 'error'); return; }
    const enquiryPayload = {
      providerId: provider.id, participantId: state.user.id,
      participantName: state.user.name, providerName: provider.name,
      subject: `Enquiry about ${provider.name}`, message: enquiryText,
    };
    dispatch({type:ACTION_TYPES.SEND_ENQUIRY,payload:enquiryPayload});
    // Persist to DB
    db.sendEnquiry(enquiryPayload);
    setEnquiryText('');
    setShowEnquiryModal(false);
    addToast('Enquiry sent successfully!', 'success');
  };

  const submitBooking = async () => {
    if (!state.user || !bookingData.date) { addToast('Please fill in booking details', 'error'); return; }
    const bookingPayload = {
      providerId: provider.id, participantId: state.user.id,
      participantName: state.user.name, providerName: provider.name,
      service: bookingData.service, date: bookingData.date, time: bookingData.time,
      duration: '1 hour', notes: bookingData.notes,
    };
    dispatch({type:ACTION_TYPES.CREATE_BOOKING,payload:bookingPayload});
    // Persist to DB
    db.createBooking(bookingPayload);
    setBookingData({ service: '', date: '', time: '', notes: '' });
    setShowBookingModal(false);
    addToast('Booking request sent!', 'success');
  };

  const submitReview = async () => {
    if (!state.user || !reviewData.text.trim()) { addToast('Please write a review', 'error'); return; }
    const reviewPayload = {
      providerId: provider.id, participantId: state.user.id,
      participantName: state.user.name.split(' ')[0] + ' ' + state.user.name.split(' ').pop()[0] + '.',
      rating: reviewData.rating, text: reviewData.text,
    };
    dispatch({type:ACTION_TYPES.SUBMIT_REVIEW,payload:reviewPayload});
    // Persist to DB
    db.submitReview(reviewPayload);
    setReviewData({ rating: 5, text: '' });
    setShowReviewModal(false);
    addToast('Review submitted!', 'success');
  };

  return React.createElement('div', { style: { padding: responsive.isMobile ? '140px 16px 40px' : '96px 32px 40px', maxWidth: '1000px', margin: '0 auto' } },
    // Back button
    React.createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => dispatch({type:ACTION_TYPES.NAV_BACK}), icon: Icons.arrowLeft(16), style: { marginBottom: '16px' } }, 'Back'),

    // Hero Card
    React.createElement(Card, { style: { marginBottom: '24px', overflow: 'hidden', position: 'relative' } },
      React.createElement('div', { style: { height: '120px', background: `linear-gradient(135deg, ${tierColors[provider.tier]}30, ${COLORS.primary[500]}20)`, margin: '-24px -24px 20px' } }),
      React.createElement('div', { style: { display: 'flex', gap: '16px', alignItems: responsive.isMobile ? 'flex-start' : 'center', flexDirection: responsive.isMobile ? 'column' : 'row' } },
        React.createElement(Avatar, { name: provider.name, size: 72, style: { marginTop: '-36px', border: `3px solid ${c.surface}` } }),
        React.createElement('div', { style: { flex: 1 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
            React.createElement('h1', { style: { fontSize: FONT_SIZES.xl, fontWeight: 800, color: c.text } }, provider.name),
            provider.verified && Icons.verified(20, COLORS.accent[500]),
            React.createElement(Badge, { variant: provider.tier }, provider.tier.charAt(0).toUpperCase() + provider.tier.slice(1)),
          ),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', flexWrap: 'wrap' } },
            React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: FONT_SIZES.sm, color: c.textSecondary } }, Icons.mapPin(14), provider.suburb + ', ' + provider.state),
            React.createElement('a', { href: 'tel:' + provider.phone, style: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: FONT_SIZES.sm, color: c.textSecondary, textDecoration: 'none' } }, Icons.phone(14), provider.phone),
            provider.website && React.createElement('a', {
              href: provider.website.startsWith('http') ? provider.website : 'https://' + provider.website,
              target: '_blank', rel: 'noopener noreferrer',
              style: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: FONT_SIZES.sm, color: COLORS.primary[500], textDecoration: 'none' },
            }, Icons.globe(14), 'Website'),
            React.createElement(StarRating, { rating: provider.rating, size: 14, showValue: true }),
            React.createElement('button', {
              onClick: () => setActiveTab('reviews'),
              style: { background:'none',border:'none',cursor:'pointer',fontSize: FONT_SIZES.sm, color: c.textMuted, fontFamily: FONTS.sans, padding: 0 },
              onMouseEnter: (e) => e.target.style.textDecoration = 'underline',
              onMouseLeave: (e) => e.target.style.textDecoration = 'none',
            }, `(${provider.reviewCount} reviews)`),
          ),
        ),
        React.createElement('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
          participant && React.createElement('button', {
            onClick: () => dispatch({type:ACTION_TYPES.TOGGLE_FAVOURITE,payload:provider.id}),
            style: { background: 'none', border: `1px solid ${c.border}`, borderRadius: RADIUS.md, padding: '8px', cursor: 'pointer', color: isFav ? COLORS.error : c.textMuted },
          }, isFav ? Icons.heartFilled(18, COLORS.error) : Icons.heart(18)),
          React.createElement(Button, { variant: 'secondary', size: 'sm', onClick: () => setShowEnquiryModal(true), icon: Icons.mail(16) }, 'Enquire'),
          provider.tier === 'premium' && React.createElement(Button, { variant: 'primary', size: 'sm', onClick: () => setShowBookingModal(true), icon: Icons.calendar(16) }, 'Book'),
          React.createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => setShowReportModal(true), icon: Icons.flag(16, COLORS.error), style: { color: COLORS.error } }, 'Report'),
        ),
      ),
    ),

    // Tabs
    React.createElement(Tabs, {
      tabs: [{ key: 'about', label: 'About' }, { key: 'services', label: 'Services' }, { key: 'reviews', label: `Reviews (${reviews.length})` }, { key: 'availability', label: 'Availability' }],
      active: activeTab, onChange: setActiveTab, style: { marginBottom: '24px' },
    }),

    // Tab Content
    activeTab === 'about' && React.createElement(Card, null,
      React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text, marginBottom: '12px' } }, 'About'),
      React.createElement('p', { style: { color: c.textSecondary, lineHeight: 1.7, marginBottom: '20px' } }, provider.description),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' } },
        [['Founded', provider.founded], ['Team Size', provider.teamSize], ['Response Time', provider.responseTime], ['Wait Time', provider.waitTime],
         ['Response Rate', provider.responseRate + '%'], ['Languages', provider.languages.join(', ')],
        ].map(([k, v], i) => React.createElement('div', { key: i },
          React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' } }, k),
          React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.text, fontWeight: 600 } }, v),
        )),
      ),
      provider.workerScreeningStatus && React.createElement('div', { style: { marginTop: '16px', padding: '14px 16px', borderRadius: RADIUS.md, background: provider.workerScreeningStatus === 'verified' ? `${COLORS.success}12` : provider.workerScreeningStatus === 'pending' ? `${COLORS.warning}12` : `${COLORS.error}12`, display: 'flex', alignItems: 'center', gap: '10px' } },
        Icons.shieldCheck(20, provider.workerScreeningStatus === 'verified' ? COLORS.success : provider.workerScreeningStatus === 'pending' ? COLORS.warning : COLORS.error),
        React.createElement('div', null,
          React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 700, color: c.text } },
            provider.workerScreeningStatus === 'verified' ? 'NDIS Worker Screening: Verified' :
            provider.workerScreeningStatus === 'pending' ? 'NDIS Worker Screening: Pending' :
            'NDIS Worker Screening: Not Submitted'),
          provider.workerScreeningStatus === 'verified' && provider.workerScreeningExpiry && React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted } }, `Expires: ${provider.workerScreeningExpiry}`),
        ),
      ),
      provider.features.length > 0 && React.createElement(Fragment, null,
        React.createElement(Divider),
        React.createElement('h4', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text, marginBottom: '12px' } }, 'Features'),
        React.createElement('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
          provider.features.map((f, i) => React.createElement(Badge, { key: i, variant: 'success', size: 'xs' }, f)),
        ),
      ),
      provider.photos.length > 0 && React.createElement(Fragment, null,
        React.createElement(Divider),
        React.createElement('h4', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text, marginBottom: '12px' } }, 'Photos'),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' } },
          provider.photos.map((p, i) => React.createElement('div', { key: i, style: { height: '100px', borderRadius: RADIUS.md, background: COLORS.gradientCard, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
            React.createElement('span', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, textAlign: 'center', padding: '8px' } }, p),
          )),
        ),
      ),
    ),

    activeTab === 'services' && React.createElement(Card, null,
      React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text, marginBottom: '16px' } }, 'Services'),
      React.createElement('div', { style: { display: 'grid', gap: '12px' } },
        provider.categories.map(catId => {
          const cat = CATEGORIES.find(c => c.id === catId);
          return cat ? React.createElement(Card, { key: catId, glass: true, style: { display: 'flex', gap: '12px', alignItems: 'center' } },
            React.createElement('div', { style: { fontSize: '28px' } }, cat.icon),
            React.createElement('div', null,
              React.createElement('h4', { style: { fontSize: FONT_SIZES.base, fontWeight: 600, color: c.text } }, cat.name),
              React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary } }, cat.desc),
            ),
          ) : null;
        }),
      ),
      React.createElement(Divider),
      React.createElement('h4', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text, marginBottom: '12px' } }, 'Service Areas'),
      React.createElement('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
        provider.serviceAreas.map((a, i) => React.createElement(Badge, { key: i, size: 'xs' }, a)),
      ),
      React.createElement(Divider),
      React.createElement('h4', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text, marginBottom: '12px' } }, 'Accepted Plan Types'),
      React.createElement('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
        provider.planTypes.map((p, i) => React.createElement(Badge, { key: i, variant: 'info', size: 'xs' }, p)),
      ),
    ),

    activeTab === 'reviews' && React.createElement('div', null,
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' } },
        React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text } }, `Reviews (${reviews.length})`),
        state.user?.role === 'participant' && React.createElement(Button, { variant: 'secondary', size: 'sm', onClick: () => setShowReviewModal(true) }, 'Write Review'),
      ),
      reviews.length === 0 ? React.createElement(EmptyState, { title: 'No reviews yet', description: 'Be the first to review this provider!' }) :
      reviews.map(r => React.createElement(Card, { key: r.id, style: { marginBottom: '12px' } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
            React.createElement(Avatar, { name: r.participantName, size: 32 }),
            React.createElement('div', null,
              React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text } }, r.participantName),
              React.createElement(StarRating, { rating: r.rating, size: 12 }),
            ),
          ),
          React.createElement('span', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted } }, r.date),
        ),
        React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary, lineHeight: 1.6 } }, r.text),
        r.response && React.createElement('div', { style: { marginTop: '12px', padding: '12px', borderRadius: RADIUS.md, background: c.surfaceAlt, borderLeft: `3px solid ${COLORS.primary[500]}` } },
          React.createElement('p', { style: { fontSize: FONT_SIZES.xs, fontWeight: 600, color: COLORS.primary[500], marginBottom: '4px' } }, 'Provider Response'),
          React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary } }, r.response),
        ),
      )),
    ),

    activeTab === 'availability' && React.createElement(Card, null,
      React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text, marginBottom: '16px' } }, 'Availability'),
      React.createElement('div', { style: { display: 'grid', gap: '8px' } },
        Object.entries(provider.availability).map(([day, hours]) => React.createElement('div', {
          key: day,
          style: { display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: RADIUS.md, background: hours === 'Closed' ? `${COLORS.error}08` : c.surfaceAlt },
        },
          React.createElement('span', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text, textTransform: 'capitalize' } }, day),
          React.createElement('span', { style: { fontSize: FONT_SIZES.sm, color: hours === 'Closed' ? COLORS.error : COLORS.success, fontFamily: FONTS.mono } }, hours),
        )),
      ),
    ),

    // Report Modal
    React.createElement(Modal, { open: showReportModal, onClose: () => setShowReportModal(false), title: 'Report Provider' },
      React.createElement('div', null,
        React.createElement('p', { style: { color: c.textSecondary, marginBottom: '16px', fontSize: FONT_SIZES.sm } }, 'Help us keep NexaConnect safe. Reports are reviewed by our team within 2 business days.'),
        React.createElement(Select, {
          label: 'Reason',
          value: reportData.reason,
          onChange: v => setReportData(p => ({...p, reason: v})),
          options: [
            { value: '', label: 'Select a reason...' },
            { value: 'misconduct', label: 'Misconduct or unprofessional behaviour' },
            { value: 'inaccurate', label: 'Inaccurate or misleading information' },
            { value: 'safety', label: 'Safety concern' },
            { value: 'fraud', label: 'Suspected fraud' },
            { value: 'other', label: 'Other' },
          ],
        }),
        React.createElement(Input, { textarea: true, label: 'Additional Details', value: reportData.notes, onChange: v => setReportData(p => ({...p, notes: v})), placeholder: 'Please describe the issue in detail...' }),
        React.createElement(Button, {
          variant: 'danger', fullWidth: true,
          onClick: () => {
            if (!reportData.reason) { addToast('Please select a reason', 'error'); return; }
            dispatch({ type: ACTION_TYPES.SUBMIT_REPORT, payload: { providerId: provider.id, providerName: provider.name, reason: reportData.reason, notes: reportData.notes, reportedBy: state.user?.id || 'anonymous' } });
            setShowReportModal(false);
            setReportData({ reason: '', notes: '' });
            addToast('Report submitted. Thank you for helping keep NexaConnect safe.', 'success');
          },
        }, 'Submit Report'),
      ),
    ),

    // Enquiry Modal
    React.createElement(Modal, { open: showEnquiryModal, onClose: () => setShowEnquiryModal(false), title: 'Send Enquiry' },
      !state.user ? React.createElement('div', null,
        React.createElement('p', { style: { color: c.textSecondary, marginBottom: '16px' } }, 'Please log in to send an enquiry.'),
        React.createElement(Button, { variant: 'primary', onClick: () => { setShowEnquiryModal(false); dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'login'}}); } }, 'Log In'),
      ) :
      React.createElement('div', null,
        React.createElement('p', { style: { color: c.textSecondary, marginBottom: '16px' } }, `Send a message to ${provider.name}`),
        React.createElement(Input, { textarea: true, label: 'Your Message', value: enquiryText, onChange: setEnquiryText, placeholder: 'Describe what services you are looking for...' }),
        React.createElement(Button, { variant: 'primary', onClick: sendEnquiry, fullWidth: true }, 'Send Enquiry'),
      ),
    ),

    // Booking Modal
    React.createElement(Modal, { open: showBookingModal, onClose: () => setShowBookingModal(false), title: 'Book Appointment' },
      !state.user ? React.createElement('div', null,
        React.createElement('p', { style: { color: c.textSecondary, marginBottom: '16px' } }, 'Please log in to book.'),
        React.createElement(Button, { variant: 'primary', onClick: () => { setShowBookingModal(false); dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'login'}}); } }, 'Log In'),
      ) :
      React.createElement('div', null,
        React.createElement(Select, { label: 'Service', value: bookingData.service, onChange: v => setBookingData(p => ({...p,service:v})),
          options: [{value:'',label:'Select service'},...provider.categories.map(cId => { const ct = CATEGORIES.find(x=>x.id===cId); return ct ? {value:ct.name,label:ct.name} : null; }).filter(Boolean)] }),
        React.createElement(Input, { label: 'Date', type: 'date', value: bookingData.date, onChange: v => setBookingData(p => ({...p,date:v})) }),
        React.createElement(Input, { label: 'Preferred Time', value: bookingData.time, onChange: v => setBookingData(p => ({...p,time:v})), placeholder: 'e.g. 10:00 AM' }),
        React.createElement(Input, { textarea: true, label: 'Notes', value: bookingData.notes, onChange: v => setBookingData(p => ({...p,notes:v})), placeholder: 'Any additional information...' }),
        React.createElement(Button, { variant: 'primary', onClick: submitBooking, fullWidth: true }, 'Request Booking'),
      ),
    ),

    // Review Modal
    React.createElement(Modal, { open: showReviewModal, onClose: () => setShowReviewModal(false), title: 'Write a Review' },
      React.createElement('div', null,
        React.createElement('div', { style: { marginBottom: '16px' } },
          React.createElement('label', { style: { display: 'block', fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text, marginBottom: '8px' } }, 'Rating'),
          React.createElement(StarRating, { rating: reviewData.rating, size: 24, onChange: v => setReviewData(p => ({...p,rating:v})) }),
        ),
        React.createElement(Input, { textarea: true, label: 'Your Review', value: reviewData.text, onChange: v => setReviewData(p => ({...p,text:v})), placeholder: 'Share your experience...' }),
        React.createElement(Button, { variant: 'primary', onClick: submitReview, fullWidth: true }, 'Submit Review'),
      ),
    ),
  );
}


/* ═══════════════════════════════════════════════════════════════
   Phase 6: Provider Dashboard
   ═══════════════════════════════════════════════════════════════ */

function WorkerScreeningForm({ provider, dispatch, addToast, responsive }) {
  const { theme } = useTheme();
  const c = COLORS[theme];
  const [wsNum, setWsNum] = useState(provider.workerScreeningNumber || '');
  const [wsExpiry, setWsExpiry] = useState(provider.workerScreeningExpiry || '');

  return React.createElement(React.Fragment, null,
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '0 16px' } },
      React.createElement(Input, { label: 'Screening Check Number', value: wsNum, onChange: setWsNum, placeholder: 'e.g. WSC-2024-001234' }),
      React.createElement(Input, { label: 'Expiry Date', type: 'date', value: wsExpiry, onChange: setWsExpiry }),
    ),
    React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, marginBottom: '12px' } }, 'Enter your NDIS Worker Screening Check number and expiry date. Your submission will be reviewed within 2 business days.'),
    React.createElement(Button, {
      variant: 'secondary', size: 'sm',
      onClick: () => {
        if (!wsNum.trim()) { addToast('Please enter your screening check number', 'error'); return; }
        dispatch({ type: ACTION_TYPES.UPDATE_WORKER_SCREENING, payload: { id: provider.id, number: wsNum, expiry: wsExpiry, status: 'pending' } });
        addToast('Worker Screening Check submitted for review!', 'success');
      },
      icon: Icons.shieldCheck(16, COLORS.primary[500]),
    }, 'Submit for Review'),
  );
}

function ProviderDashboard() {
  const { theme } = useTheme();
  const { state, dispatch } = useApp();
  const responsive = useResponsive();
  const c = COLORS[theme];
  const { addToast } = useToast();
  const tab = state.dashboardTab;

  const provider = state.providers.find(p => p.email === state.user?.email);
  const analytics = useMemo(() => provider ? generateAnalytics(provider) : [], [provider?.id]);

  // All useState hooks must be called unconditionally (React Rules of Hooks)
  const [editData, setEditData] = useState(() => provider ? {
    description: provider.description, shortDescription: provider.shortDescription,
    phone: provider.phone, website: provider.website,
    suburb: provider.suburb, waitTime: provider.waitTime,
  } : {});
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [provAttachDoc, setProvAttachDoc] = useState(null);
  const [showProvDocPicker, setShowProvDocPicker] = useState(false);

  if (!provider) return React.createElement(EmptyState, { title: 'Provider not found' });

  const myReviews = state.reviews.filter(r => r.providerId === provider.id);
  const myEnquiries = state.enquiries.filter(e => e.providerId === provider.id);
  const myBookings = state.bookings.filter(b => b.providerId === provider.id);
  const plan = PLANS.find(p => p.id === provider.tier) || PLANS[0];

  // ── Overview Tab ──
  if (tab === 'overview') return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
    React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '8px' } }, `Welcome, ${provider.name}`),
    React.createElement('p', { style: { color: c.textSecondary, marginBottom: '24px' } }, 'Here is an overview of your account.'),

    // Quick Stats
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' } },
      React.createElement(StatCard, { icon: Icons.eye(20, COLORS.primary[500]), label: 'Profile Views', value: provider.viewsThisMonth, change: 12, trend: 'up' }),
      React.createElement(StatCard, { icon: Icons.mail(20, COLORS.accent[500]), label: 'Enquiries', value: provider.enquiriesThisMonth, change: 8, trend: 'up' }),
      React.createElement(StatCard, { icon: Icons.calendar(20, COLORS.success), label: 'Bookings', value: provider.bookingsThisMonth, change: 15, trend: 'up' }),
      React.createElement(StatCard, { icon: Icons.star(20, COLORS.star), label: 'Rating', value: provider.rating.toFixed(1), change: 2, trend: 'up' }),
    ),

    // Onboarding Wizard
    (() => {
      const steps = getOnboardingSteps(provider);
      const doneCount = steps.filter(s => s.done).length;
      const pct = Math.round((doneCount / steps.length) * 100);
      if (pct === 100) return null;
      return React.createElement(Card, { style: { marginBottom: '24px', border: `1px solid ${COLORS.primary[500]}40` } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' } },
          React.createElement('div', null,
            React.createElement('h3', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text } }, 'Complete Your Profile'),
            React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, marginTop: '2px' } }, `${doneCount} of ${steps.length} steps completed`),
          ),
          React.createElement('span', { style: { fontSize: FONT_SIZES.sm, fontWeight: 700, color: COLORS.primary[500] } }, `${pct}%`),
        ),
        React.createElement(ProgressBar, { value: pct, max: 100, style: { marginBottom: '16px' } }),
        React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } },
          steps.map(step => React.createElement('div', {
            key: step.key,
            onClick: () => step.key === 'services' ? dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'directory'}}) : dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload:'profile-edit'}),
            style: {
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
              borderRadius: RADIUS.full, cursor: 'pointer', transition: 'all 0.2s',
              background: step.done ? `${COLORS.success}15` : c.surfaceAlt,
              border: `1px solid ${step.done ? COLORS.success : c.border}`,
            },
          },
            step.done
              ? Icons.check(14, COLORS.success)
              : React.createElement('div', { style: { width: 14, height: 14, borderRadius: '50%', border: `2px solid ${c.border}` } }),
            React.createElement('span', { style: { fontSize: FONT_SIZES.xs, fontWeight: 600, color: step.done ? COLORS.success : c.textSecondary } }, step.label),
          )),
        ),
      );
    })(),

    // Recent Activity
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '24px' } },
      // Recent Enquiries
      React.createElement(Card, null,
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' } },
          React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text } }, 'Recent Enquiries'),
          myEnquiries.length > 0 && React.createElement('button', {
            onClick: () => dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload:'inbox'}),
            style: { background:'none',border:'none',cursor:'pointer',color:COLORS.primary[500],fontFamily:FONTS.sans,fontSize:FONT_SIZES.sm,fontWeight:600 },
          }, 'View All \u2192'),
        ),
        myEnquiries.slice(0, 3).map(e => React.createElement('div', {
          key: e.id,
          onClick: () => { dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload:'inbox'}); setSelectedEnquiry(e.id); },
          style: { display: 'flex', gap: '10px', padding: '10px 0', borderBottom: `1px solid ${c.border}`, cursor: 'pointer', borderRadius: RADIUS.sm, transition: 'background 0.2s' },
          onMouseEnter: (ev) => ev.currentTarget.style.background = c.surfaceHover,
          onMouseLeave: (ev) => ev.currentTarget.style.background = 'transparent',
        },
          React.createElement(Avatar, { name: e.participantName, size: 32 }),
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text } }, e.participantName),
            React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, e.subject),
          ),
          React.createElement(Badge, { variant: e.status === 'active' ? 'success' : 'default', size: 'xs' }, e.status),
        )),
        myEnquiries.length === 0 && React.createElement('p', { style: { color: c.textMuted, fontSize: FONT_SIZES.sm } }, 'No enquiries yet'),
      ),
      // Recent Reviews
      React.createElement(Card, null,
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' } },
          React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text } }, 'Recent Reviews'),
          myReviews.length > 0 && React.createElement('button', {
            onClick: () => dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload:'reviews'}),
            style: { background:'none',border:'none',cursor:'pointer',color:COLORS.primary[500],fontFamily:FONTS.sans,fontSize:FONT_SIZES.sm,fontWeight:600 },
          }, 'View All \u2192'),
        ),
        myReviews.slice(0, 3).map(r => React.createElement('div', {
          key: r.id,
          onClick: () => dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload:'reviews'}),
          style: { padding: '10px 0', borderBottom: `1px solid ${c.border}`, cursor: 'pointer', borderRadius: RADIUS.sm, transition: 'background 0.2s' },
          onMouseEnter: (ev) => ev.currentTarget.style.background = c.surfaceHover,
          onMouseLeave: (ev) => ev.currentTarget.style.background = 'transparent',
        },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' } },
            React.createElement('span', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text } }, r.participantName),
            React.createElement(StarRating, { rating: r.rating, size: 12 }),
          ),
          React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textSecondary, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } }, r.text),
        )),
        myReviews.length === 0 && React.createElement('p', { style: { color: c.textMuted, fontSize: FONT_SIZES.sm } }, 'No reviews yet'),
      ),
    ),
  );

  // ── Analytics Tab ──
  if (tab === 'analytics') {
    if (provider.tier === 'starter') return React.createElement('div', { style: { padding: '24px 32px' } },
      React.createElement(EmptyState, {
        icon: Icons.barChart(48, c.textMuted), title: 'Analytics Locked',
        description: 'Upgrade to Professional or Premium to access analytics.',
        action: React.createElement(Button, { variant: 'primary', onClick: () => dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload:'subscription'}) }, 'Upgrade Now'),
      }),
    );

    return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
      React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '24px' } }, 'Analytics'),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '24px' } },
        // Views Chart
        React.createElement(Card, null,
          React.createElement('h3', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text, marginBottom: '16px' } }, 'Profile Views'),
          React.createElement(ResponsiveContainer, { width: '100%', height: 250 },
            React.createElement(LineChart, { data: analytics },
              React.createElement(CartesianGrid, { strokeDasharray: '3 3', stroke: c.border }),
              React.createElement(XAxis, { dataKey: 'month', stroke: c.textMuted, fontSize: 12 }),
              React.createElement(YAxis, { stroke: c.textMuted, fontSize: 12 }),
              React.createElement(Tooltip, { contentStyle: { background: c.surface, border: `1px solid ${c.border}`, borderRadius: RADIUS.md } }),
              React.createElement(Line, { type: 'monotone', dataKey: 'views', stroke: COLORS.primary[500], strokeWidth: 2, dot: { fill: COLORS.primary[500] } }),
            ),
          ),
        ),
        // Enquiries Chart
        React.createElement(Card, null,
          React.createElement('h3', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text, marginBottom: '16px' } }, 'Enquiries'),
          React.createElement(ResponsiveContainer, { width: '100%', height: 250 },
            React.createElement(BarChart, { data: analytics },
              React.createElement(CartesianGrid, { strokeDasharray: '3 3', stroke: c.border }),
              React.createElement(XAxis, { dataKey: 'month', stroke: c.textMuted, fontSize: 12 }),
              React.createElement(YAxis, { stroke: c.textMuted, fontSize: 12 }),
              React.createElement(Tooltip, { contentStyle: { background: c.surface, border: `1px solid ${c.border}`, borderRadius: RADIUS.md } }),
              React.createElement(Bar, { dataKey: 'enquiries', fill: COLORS.accent[500], radius: [4, 4, 0, 0] }),
            ),
          ),
        ),
        // Search Appearances
        React.createElement(Card, null,
          React.createElement('h3', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text, marginBottom: '16px' } }, 'Search Appearances'),
          React.createElement(ResponsiveContainer, { width: '100%', height: 250 },
            React.createElement(AreaChart, { data: analytics },
              React.createElement(CartesianGrid, { strokeDasharray: '3 3', stroke: c.border }),
              React.createElement(XAxis, { dataKey: 'month', stroke: c.textMuted, fontSize: 12 }),
              React.createElement(YAxis, { stroke: c.textMuted, fontSize: 12 }),
              React.createElement(Tooltip, { contentStyle: { background: c.surface, border: `1px solid ${c.border}`, borderRadius: RADIUS.md } }),
              React.createElement(Area, { type: 'monotone', dataKey: 'searchAppearances', stroke: COLORS.primary[400], fill: `${COLORS.primary[500]}20` }),
            ),
          ),
        ),
        // Category Breakdown
        React.createElement(Card, null,
          React.createElement('h3', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text, marginBottom: '16px' } }, 'Enquiry Categories'),
          React.createElement(ResponsiveContainer, { width: '100%', height: 250 },
            React.createElement(PieChart, null,
              React.createElement(Pie, { data: CATEGORY_ANALYTICS, dataKey: 'value', nameKey: 'name', cx: '50%', cy: '50%', outerRadius: 80, label: ({name,percent}) => `${name} ${(percent*100).toFixed(0)}%` },
                CATEGORY_ANALYTICS.map((_, i) => React.createElement(Cell, { key: i, fill: PIE_COLORS[i % PIE_COLORS.length] })),
              ),
              React.createElement(Tooltip),
            ),
          ),
        ),
      ),
    );
  }

  // ── Profile Editor Tab ──
  if (tab === 'profile-edit') {
    const saveProfile = async () => {
      dispatch({type:ACTION_TYPES.UPDATE_PROVIDER_PROFILE,payload:{ id: provider.id, ...editData }});
      // Persist to Supabase if configured
      if (isSupabaseConfigured() && provider.id && !provider.id.startsWith('p')) {
        await db.updateProvider(provider.id, editData);
      }
      addToast('Profile updated!', 'success');
    };
    return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px', maxWidth: '800px' } },
      React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '24px' } }, 'Edit Profile'),
      React.createElement(Card, null,
        React.createElement(Input, { label: 'Short Description', value: editData.shortDescription, onChange: v => setEditData(p=>({...p,shortDescription:v})),
          placeholder: 'Brief summary of your services' }),
        React.createElement(Input, { textarea: true, label: 'Full Description', value: editData.description, onChange: v => setEditData(p=>({...p,description:v})) }),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '0 16px' } },
          React.createElement(Input, { label: 'Phone', value: editData.phone, onChange: v => setEditData(p=>({...p,phone:v})) }),
          React.createElement(Input, { label: 'Website', value: editData.website, onChange: v => setEditData(p=>({...p,website:v})) }),
          React.createElement(Select, { label: 'Suburb', value: editData.suburb, onChange: v => setEditData(p=>({...p,suburb:v})),
            options: SUBURBS.map(s=>({value:s,label:s})) }),
          React.createElement(Input, { label: 'Wait Time', value: editData.waitTime, onChange: v => setEditData(p=>({...p,waitTime:v})) }),
        ),
        React.createElement(Button, { variant: 'primary', onClick: saveProfile }, 'Save Changes'),
      ),

      React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text, margin: '24px 0 16px' } }, 'NDIS Worker Screening Check'),
      React.createElement(Card, { style: { border: provider.workerScreeningStatus === 'verified' ? `1px solid ${COLORS.success}60` : undefined } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' } },
          Icons.shieldCheck(20, provider.workerScreeningStatus === 'verified' ? COLORS.success : provider.workerScreeningStatus === 'pending' ? COLORS.warning : c.textMuted),
          React.createElement('div', null,
            React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 700, color: c.text } }, 'Worker Screening Status'),
            React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: provider.workerScreeningStatus === 'verified' ? COLORS.success : provider.workerScreeningStatus === 'pending' ? COLORS.warning : c.textMuted, fontWeight: 600 } },
              provider.workerScreeningStatus === 'verified' ? 'Verified' : provider.workerScreeningStatus === 'pending' ? 'Pending Review' : 'Not Submitted'),
          ),
        ),
        React.createElement(WorkerScreeningForm, { provider, dispatch, addToast, responsive }),
      ),
    );
  }

  // ── Inbox Tab ──
  if (tab === 'inbox') {
    const sel = myEnquiries.find(e => e.id === selectedEnquiry);

    const sendReply = async () => {
      if (!replyText.trim() && !provAttachDoc) return;
      const msgPayload = { enquiryId: selectedEnquiry, text: replyText, from: 'provider' };
      if (provAttachDoc) msgPayload.attachment = provAttachDoc;
      dispatch({type:ACTION_TYPES.REPLY_ENQUIRY,payload:msgPayload});
      // Persist to DB
      db.replyEnquiry(selectedEnquiry, replyText, 'provider');
      setReplyText('');
      setProvAttachDoc(null);
      addToast('Reply sent!', 'success');
    };

    return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
      React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '24px' } }, 'Inbox'),
      myEnquiries.length === 0 ? React.createElement(EmptyState, { icon: Icons.mail(48, c.textMuted), title: 'No enquiries', description: 'Enquiries from participants will appear here.' }) :
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : selectedEnquiry ? '300px 1fr' : '1fr', gap: '16px' } },
        // Enquiry list
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
          myEnquiries.map(e => React.createElement(Card, {
            key: e.id, hover: true,
            onClick: () => setSelectedEnquiry(e.id),
            style: { cursor: 'pointer', border: selectedEnquiry === e.id ? `2px solid ${COLORS.primary[500]}` : undefined, padding: '14px' },
          },
            React.createElement('div', { style: { display: 'flex', gap: '10px', alignItems: 'center' } },
              React.createElement(Avatar, { name: e.participantName, size: 32 }),
              React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text } }, e.participantName),
                React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, e.subject),
              ),
              React.createElement(Badge, { variant: e.status === 'active' ? 'success' : 'default', size: 'xs' }, e.status),
            ),
          )),
        ),

        // Selected thread
        sel && React.createElement(Card, { style: { display: 'flex', flexDirection: 'column', maxHeight: '600px' } },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: `1px solid ${c.border}` } },
            React.createElement('div', null,
              React.createElement('h3', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text } }, sel.participantName),
              React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted } }, sel.subject),
            ),
            sel.status === 'active' && React.createElement(Button, { variant: 'ghost', size: 'sm',
              onClick: () => { dispatch({type:ACTION_TYPES.CLOSE_ENQUIRY,payload:sel.id}); db.closeEnquiry(sel.id); addToast('Enquiry closed', 'info'); }
            }, 'Close'),
          ),
          React.createElement('div', { style: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' } },
            sel.messages.map((m, i) => React.createElement('div', { key: i, style: { display: 'flex', justifyContent: m.from === 'provider' ? 'flex-end' : 'flex-start' } },
              React.createElement('div', { style: { maxWidth: '80%' } },
                React.createElement('div', { style: {
                  padding: '10px 14px', borderRadius: RADIUS.md,
                  background: m.from === 'provider' ? COLORS.primary[500] : c.surfaceAlt,
                  color: m.from === 'provider' ? '#fff' : c.text,
                } },
                  m.text && React.createElement('p', { style: { fontSize: FONT_SIZES.sm } }, m.text),
                  m.attachment && React.createElement('div', {
                    style: {
                      display: 'flex', alignItems: 'center', gap: '8px', marginTop: m.text ? '8px' : '0',
                      padding: '8px 10px', borderRadius: RADIUS.sm,
                      background: m.from === 'provider' ? 'rgba(255,255,255,0.15)' : (theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                      cursor: 'pointer',
                    },
                    onClick: () => addToast(`Opening: ${m.attachment.name}`, 'info'),
                  },
                    Icons.fileText(16, m.from === 'provider' ? '#fff' : COLORS.primary[400]),
                    React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                      React.createElement('p', { style: { fontSize: FONT_SIZES.xs, fontWeight: 600, color: m.from === 'provider' ? '#fff' : c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, m.attachment.name),
                      React.createElement('p', { style: { fontSize: '10px', color: m.from === 'provider' ? 'rgba(255,255,255,0.7)' : c.textMuted } }, m.attachment.docType + (m.attachment.size ? ' · ' + m.attachment.size : '')),
                    ),
                    Icons.download(13, m.from === 'provider' ? 'rgba(255,255,255,0.7)' : c.textMuted),
                  ),
                  React.createElement('p', { style: { fontSize: FONT_SIZES.xs, marginTop: '4px', opacity: 0.7 } }, `${m.date} ${m.time}`),
                ),
              ),
            )),
          ),
          sel.status === 'active' && React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
            provAttachDoc && React.createElement('div', {
              style: { padding: '8px 12px', background: `${COLORS.primary[500]}15`, borderRadius: RADIUS.md, display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${COLORS.primary[500]}40` },
            },
              Icons.fileText(14, COLORS.primary[400]),
              React.createElement('span', { style: { fontSize: FONT_SIZES.xs, fontWeight: 600, color: COLORS.primary[400], flex: 1 } }, provAttachDoc.name + ' (' + provAttachDoc.docType + ')'),
              React.createElement('button', { onClick: () => setProvAttachDoc(null), style: { background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, display: 'flex' } }, Icons.x(12)),
            ),
            React.createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
              React.createElement('div', { style: { position: 'relative' } },
                React.createElement('button', {
                  onClick: () => setShowProvDocPicker(!showProvDocPicker),
                  title: 'Attach document',
                  style: { background: 'none', border: `1px solid ${c.border}`, borderRadius: RADIUS.md, cursor: 'pointer', padding: '9px 10px', color: c.textSecondary, display: 'flex', alignItems: 'center' },
                }, Icons.paperclip(16)),
                showProvDocPicker && React.createElement('div', {
                  style: {
                    position: 'absolute', bottom: '100%', left: 0, marginBottom: '4px',
                    background: c.surface, border: `1px solid ${c.border}`, borderRadius: RADIUS.md,
                    boxShadow: c.cardShadow, overflow: 'hidden', zIndex: 100, minWidth: '180px',
                  },
                },
                  React.createElement('p', { style: { fontSize: FONT_SIZES.xs, fontWeight: 700, color: c.textMuted, padding: '8px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Document Type'),
                  ['Service Agreement', 'NDIS Plan', 'Invoice', 'Other'].map(docType => React.createElement('button', {
                    key: docType,
                    onClick: () => {
                      setProvAttachDoc({ name: docType + '.pdf', docType });
                      setShowProvDocPicker(false);
                    },
                    style: { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: c.text, fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, textAlign: 'left' },
                    onMouseEnter: (e) => e.currentTarget.style.background = c.surfaceHover,
                    onMouseLeave: (e) => e.currentTarget.style.background = 'none',
                  }, Icons.fileText(14, COLORS.primary[400]), docType)),
                ),
              ),
              React.createElement('input', {
                value: replyText, onChange: (e) => setReplyText(e.target.value),
                placeholder: 'Type a reply...',
                onKeyDown: (e) => {
                  if (e.key === 'Enter' && (replyText.trim() || provAttachDoc)) sendReply();
                },
                style: { flex: 1, padding: '10px 14px', background: c.surfaceAlt, border: `1px solid ${c.border}`, borderRadius: RADIUS.md, color: c.text, outline: 'none', fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm },
              }),
              React.createElement(Button, { variant: 'primary', size: 'sm', onClick: sendReply, icon: Icons.send(16, '#fff') }),
            ),
          ),
        ),
      ),
    );
  }

  // ── Bookings Tab ──
  if (tab === 'bookings') {
    return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
      React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '24px' } }, 'Bookings'),
      myBookings.length === 0 ? React.createElement(EmptyState, { icon: Icons.calendar(48, c.textMuted), title: 'No bookings', description: 'Bookings will appear here when participants book with you.' }) :
      React.createElement('div', { style: { display: 'grid', gap: '12px' } },
        myBookings.map(b => React.createElement(Card, { key: b.id },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' } },
            React.createElement('div', null,
              React.createElement('h4', { style: { fontSize: FONT_SIZES.base, fontWeight: 600, color: c.text } }, b.participantName),
              React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary } }, b.service),
            ),
            React.createElement(Badge, { variant: b.status === 'confirmed' ? 'success' : b.status === 'pending' ? 'warning' : 'error', size: 'xs' }, b.status),
          ),
          React.createElement('div', { style: { display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' } },
            React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: FONT_SIZES.sm, color: c.textSecondary } }, Icons.calendar(14), b.date),
            React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: FONT_SIZES.sm, color: c.textSecondary } }, Icons.clock(14), b.time),
            React.createElement('span', { style: { fontSize: FONT_SIZES.sm, color: c.textMuted } }, b.duration),
          ),
          b.notes && React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, fontStyle: 'italic' } }, b.notes),
          b.status === 'pending' && React.createElement('div', { style: { display: 'flex', gap: '8px', marginTop: '12px' } },
            React.createElement(Button, { variant: 'primary', size: 'sm', onClick: () => { dispatch({type:ACTION_TYPES.UPDATE_BOOKING,payload:{id:b.id,status:'confirmed'}}); db.updateBooking(b.id,{status:'confirmed'}); addToast('Booking confirmed!', 'success'); } }, 'Accept'),
            React.createElement(Button, { variant: 'danger', size: 'sm', onClick: () => { dispatch({type:ACTION_TYPES.UPDATE_BOOKING,payload:{id:b.id,status:'cancelled'}}); db.updateBooking(b.id,{status:'cancelled'}); addToast('Booking declined', 'info'); } }, 'Decline'),
          ),
        )),
      ),
    );
  }

  // ── Reviews Tab ──
  if (tab === 'reviews') {
    return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
      React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '8px' } }, 'Reviews'),
      React.createElement('div', { style: { display: 'flex', gap: '16px', marginBottom: '24px' } },
        React.createElement('div', { style: { textAlign: 'center' } },
          React.createElement('p', { style: { fontSize: FONT_SIZES['4xl'], fontWeight: 900, ...gradientText() } }, provider.rating.toFixed(1)),
          React.createElement(StarRating, { rating: provider.rating, size: 16 }),
          React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, marginTop: '4px' } }, `${myReviews.length} reviews`),
        ),
      ),
      myReviews.length === 0 ? React.createElement(EmptyState, { title: 'No reviews yet' }) :
      myReviews.map(r => React.createElement(Card, { key: r.id, style: { marginBottom: '12px' } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
            React.createElement(Avatar, { name: r.participantName, size: 32 }),
            React.createElement('div', null,
              React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text } }, r.participantName),
              React.createElement(StarRating, { rating: r.rating, size: 12 }),
            ),
          ),
          React.createElement('span', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted } }, r.date),
        ),
        React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary, lineHeight: 1.6 } }, r.text),
        r.response ? React.createElement('div', { style: { marginTop: '12px', padding: '12px', borderRadius: RADIUS.md, background: c.surfaceAlt, borderLeft: `3px solid ${COLORS.primary[500]}` } },
          React.createElement('p', { style: { fontSize: FONT_SIZES.xs, fontWeight: 600, color: COLORS.primary[500], marginBottom: '4px' } }, 'Your Response'),
          React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary } }, r.response),
        ) :
        (provider.tier !== 'starter' && (replyingTo === r.id ?
          React.createElement('div', { style: { marginTop: '12px', display: 'flex', gap: '8px' } },
            React.createElement('input', { value: responseText, onChange: e => setResponseText(e.target.value), placeholder: 'Write a response...', style: { flex: 1, padding: '8px 12px', background: c.surfaceAlt, border: `1px solid ${c.border}`, borderRadius: RADIUS.md, color: c.text, outline: 'none', fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm } }),
            React.createElement(Button, { variant: 'primary', size: 'sm', onClick: () => {
              dispatch({type:ACTION_TYPES.RESPOND_REVIEW,payload:{reviewId:r.id,response:responseText}});
              db.respondToReview(r.id, responseText);
              setReplyingTo(null); setResponseText(''); addToast('Response posted!', 'success');
            } }, 'Post'),
            React.createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => setReplyingTo(null) }, 'Cancel'),
          ) :
          React.createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => setReplyingTo(r.id), style: { marginTop: '8px' } }, 'Respond')
        )),
      )),
    );
  }

  // ── Subscription Tab ──
  if (tab === 'subscription') {
    const handleUpgrade = async (p) => {
      if (p.id === 'starter') {
        dispatch({type:ACTION_TYPES.UPGRADE_PLAN,payload:{providerId:provider.id,tier:p.id}});
        addToast('Downgraded to Starter!', 'success');
        return;
      }
      try {
        addToast('Redirecting to Stripe checkout...', 'info');
        await redirectToCheckout({
          providerId: provider.id,
          priceId: state.billingCycle === 'annual' ? p.stripePriceIdYearly : p.stripePriceIdMonthly,
          planName: p.id,
          billingCycle: state.billingCycle,
        });
      } catch (err) {
        console.error('Checkout error:', err);
        addToast(`Checkout error: ${err.message || 'Unknown error'}`, 'error');
      }
    };

    const handleManageBilling = async () => {
      if (isStripeConfigured() && isSupabaseConfigured() && provider.id && !provider.id.startsWith('p')) {
        try {
          await openBillingPortal(provider.id);
        } catch (err) {
          addToast('Billing portal unavailable. Set up Stripe first.', 'error');
        }
      } else {
        addToast('Billing portal requires Stripe setup.', 'info');
      }
    };

    return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
      React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '24px' } }, 'Subscription'),

      // Current plan
      React.createElement(Card, { style: { marginBottom: '24px', background: COLORS.gradientCard } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          React.createElement('div', null,
            React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textMuted, marginBottom: '4px' } }, 'Current Plan'),
            React.createElement('h3', { style: { fontSize: FONT_SIZES.xl, fontWeight: 800, color: c.text } }, plan.name),
            React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary } }, plan.price === 0 ? 'Free' : `$${plan.price}/month`),
          ),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            React.createElement(Badge, { variant: provider.tier, size: 'xs' }, provider.tier.charAt(0).toUpperCase() + provider.tier.slice(1)),
            provider.tier !== 'starter' && React.createElement(Button, { variant: 'ghost', size: 'sm', onClick: handleManageBilling }, 'Manage Billing'),
          ),
        ),
      ),

      // Plan comparison
      React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text, marginBottom: '16px' } }, 'Available Plans'),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' } },
        PLANS.map(p => React.createElement(Card, {
          key: p.id,
          style: { border: p.id === provider.tier ? `2px solid ${COLORS.primary[500]}` : undefined },
        },
          React.createElement('h4', { style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text, marginBottom: '4px' } }, p.name),
          React.createElement('p', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '16px' } },
            p.price === 0 ? 'Free' : `$${p.price}/mo`),
          p.features.slice(0, 4).map((f, i) => React.createElement('div', { key: i, style: { display: 'flex', gap: '6px', marginBottom: '6px' } },
            Icons.check(14, COLORS.success),
            React.createElement('span', { style: { fontSize: FONT_SIZES.xs, color: c.textSecondary } }, f),
          )),
          React.createElement('div', { style: { marginTop: '16px' } },
            p.id === provider.tier ?
              React.createElement(Badge, { variant: 'success' }, 'Current Plan') :
              React.createElement(Button, {
                variant: PLANS.indexOf(p) > PLANS.findIndex(x => x.id === provider.tier) ? 'primary' : 'secondary',
                size: 'sm', fullWidth: true,
                onClick: () => handleUpgrade(p),
              }, PLANS.indexOf(p) > PLANS.findIndex(x => x.id === provider.tier) ? 'Upgrade' : 'Downgrade'),
          ),
        )),
      ),

      // Billing History
      React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text, margin: '32px 0 16px' } }, 'Billing History'),
      React.createElement(Card, null,
        [{ date: '2025-12-01', amount: plan.price, status: 'Paid' }, { date: '2025-11-01', amount: plan.price, status: 'Paid' }, { date: '2025-10-01', amount: plan.price, status: 'Paid' }]
        .filter(b => b.amount > 0)
        .map((b, i) => React.createElement('div', { key: i, style: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 2 ? `1px solid ${c.border}` : 'none' } },
          React.createElement('span', { style: { fontSize: FONT_SIZES.sm, color: c.text } }, b.date),
          React.createElement('span', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text } }, `$${b.amount}`),
          React.createElement(Badge, { variant: 'success', size: 'xs' }, b.status),
        )),
        plan.price === 0 && React.createElement('p', { style: { color: c.textMuted, fontSize: FONT_SIZES.sm, textAlign: 'center', padding: '12px' } }, 'No billing history on free plan.'),
      ),
    );
  }

  return null;
}


/* ═══════════════════════════════════════════════════════════════
   Phase 7: Participant Dashboard
   ═══════════════════════════════════════════════════════════════ */

function ParticipantDashboard() {
  const { theme } = useTheme();
  const { state, dispatch } = useApp();
  const responsive = useResponsive();
  const c = COLORS[theme];
  const { addToast } = useToast();
  const tab = state.dashboardTab;

  const participant = state.participants.find(p => p.email === state.user?.email) || state.user;

  // All useState hooks must be called unconditionally (React Rules of Hooks)
  const [pSelectedId, setPSelectedId] = useState(null);
  const [pReplyText, setPReplyText] = useState('');
  const [pEditData, setPEditData] = useState(() => participant ? { name: participant.name, suburb: participant.suburb || '', phone: '' } : {});
  const [pAttachDoc, setPAttachDoc] = useState(null);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [receiptBooking, setReceiptBooking] = useState(null);

  if (!participant) return React.createElement(EmptyState, { title: 'Not found' });

  const favourites = (participant.favourites || []).map(fId => state.providers.find(p => p.id === fId)).filter(Boolean);
  const myEnquiries = state.enquiries.filter(e => e.participantId === participant.id);
  const myBookings = state.bookings.filter(b => b.participantId === participant.id);
  const myReviews = state.reviews.filter(r => r.participantId === participant.id);

  // ── Overview ──
  if (tab === 'overview') return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
    React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '8px' } }, `Welcome, ${participant.name}`),
    React.createElement('p', { style: { color: c.textSecondary, marginBottom: '24px' } }, 'Find and connect with NDIS providers.'),

    // Quick Actions
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' } },
      [
        { label: 'Browse Providers', icon: Icons.search, route: 'directory' },
        { label: 'My Favourites', icon: Icons.heart, tab: 'favourites' },
        { label: 'My Enquiries', icon: Icons.mail, tab: 'enquiries' },
        { label: 'My Bookings', icon: Icons.calendar, tab: 'bookings' },
      ].map((a, i) => React.createElement(Card, {
        key: i, hover: true,
        onClick: () => a.route ? dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:a.route}}) : dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload:a.tab}),
        style: { cursor: 'pointer', textAlign: 'center', padding: '20px' },
      },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'center', marginBottom: '8px', color: COLORS.primary[500] } }, a.icon(24, COLORS.primary[500])),
        React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text } }, a.label),
      )),
    ),

    // Stats
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' } },
      React.createElement(StatCard, { icon: Icons.heart(20, COLORS.error), label: 'Saved Providers', value: favourites.length }),
      React.createElement(StatCard, { icon: Icons.mail(20, COLORS.primary[500]), label: 'Enquiries Sent', value: myEnquiries.length }),
      React.createElement(StatCard, { icon: Icons.calendar(20, COLORS.accent[500]), label: 'Bookings', value: myBookings.length }),
      React.createElement(StatCard, { icon: Icons.star(20, COLORS.star), label: 'Reviews Given', value: myReviews.length }),
    ),

    // Saved Providers Preview
    React.createElement(Card, null,
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' } },
        React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text } }, 'Saved Providers'),
        favourites.length > 0 && React.createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload:'favourites'}) }, 'View All'),
      ),
      favourites.length === 0 ? React.createElement('p', { style: { color: c.textMuted, fontSize: FONT_SIZES.sm } }, 'No saved providers yet. Browse the directory to find providers!') :
      React.createElement('div', { style: { display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' } },
        favourites.slice(0, 4).map(p => React.createElement('div', {
          key: p.id,
          onClick: () => { dispatch({type:ACTION_TYPES.SET_SELECTED_PROVIDER,payload:p.id}); dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'provider-profile',params:{providerId:p.id}}}); },
          style: { minWidth: '160px', textAlign: 'center', padding: '16px', borderRadius: RADIUS.md, border: `1px solid ${c.border}`, cursor: 'pointer' },
        },
          React.createElement(Avatar, { name: p.name, size: 40, style: { margin: '0 auto 8px' } }),
          React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text } }, p.name),
          React.createElement(StarRating, { rating: p.rating, size: 10 }),
        )),
      ),
    ),

    // Recommended For You
    React.createElement(Card, { style: { marginTop: '24px' } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' } },
        React.createElement('div', null,
          React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text } }, 'Recommended For You'),
          React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' } },
            Icons.zap(12, COLORS.accent[400]), 'Based on your location and interests'),
        ),
        React.createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'directory'}}) }, 'Browse All'),
      ),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px' } },
        (() => {
          const suburb = participant.suburb || '';
          const cats = participant.categories || [];
          const favIds = participant.favourites || [];
          const scored = state.providers
            .filter(p => !favIds.includes(p.id))
            .map(p => {
              let score = 0;
              if (p.suburb === suburb || (p.serviceAreas || []).some(a => a.toLowerCase().includes(suburb.toLowerCase()))) score += 40;
              const catOverlap = (p.categories || []).filter(cat => cats.includes(cat)).length;
              score += catOverlap * 20;
              score += p.rating * 5;
              if (p.tier === 'premium') score += 15;
              else if (p.tier === 'professional') score += 8;
              if (p.verified) score += 10;
              return { ...p, _score: score };
            })
            .sort((a, b) => b._score - a._score)
            .slice(0, 4);
          return scored.map(p => React.createElement('div', {
            key: p.id,
            onClick: () => { dispatch({type:ACTION_TYPES.SET_SELECTED_PROVIDER,payload:p.id}); dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'provider-profile',params:{providerId:p.id}}}); },
            style: {
              display: 'flex', gap: '12px', padding: '12px', borderRadius: RADIUS.md,
              border: `1px solid ${c.border}`, cursor: 'pointer', transition: 'all 0.2s',
              background: c.surfaceAlt,
            },
            onMouseEnter: (e) => { e.currentTarget.style.borderColor = COLORS.primary[500]; e.currentTarget.style.transform = 'translateY(-1px)'; },
            onMouseLeave: (e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.transform = 'translateY(0)'; },
          },
            React.createElement(Avatar, { name: p.name, size: 44 }),
            React.createElement('div', { style: { flex: 1, minWidth: 0 } },
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' } },
                React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 700, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, p.name),
                p.verified && Icons.verified(12, COLORS.accent[500]),
              ),
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' } },
                React.createElement(StarRating, { rating: p.rating, size: 11 }),
                React.createElement('span', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted } }, `(${p.reviewCount})`),
              ),
              React.createElement('div', { style: { display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' } },
                React.createElement(Badge, { size: 'xs', variant: p.tier }, p.tier.charAt(0).toUpperCase() + p.tier.slice(1)),
                React.createElement('span', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, display: 'flex', alignItems: 'center', gap: '2px' } },
                  Icons.mapPin(10, c.textMuted), p.suburb),
              ),
            ),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 } },
              React.createElement('span', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' } },
                Icons.clock(10, c.textMuted), p.waitTime),
              React.createElement('button', {
                onClick: (e) => { e.stopPropagation(); dispatch({type:ACTION_TYPES.TOGGLE_FAVOURITE,payload:p.id}); },
                style: { background:'none',border:'none',cursor:'pointer',padding:'2px',color:c.textMuted },
              }, Icons.heart(14, c.textMuted)),
            ),
          ));
        })(),
      ),
    ),
  );

  // ── Favourites ──
  if (tab === 'favourites') return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
    React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '24px' } }, 'Saved Providers'),
    favourites.length === 0 ? React.createElement(EmptyState, {
      icon: Icons.heart(48, c.textMuted), title: 'No saved providers',
      description: 'Browse the directory and save providers you like.',
      action: React.createElement(Button, { variant: 'primary', onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'directory'}}) }, 'Browse Directory'),
    }) :
    React.createElement('div', {
      style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' },
    },
      favourites.map(p => React.createElement(ProviderCard, {
        key: p.id, provider: p,
        onView: (id) => { dispatch({type:ACTION_TYPES.SET_SELECTED_PROVIDER,payload:id}); dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'provider-profile',params:{providerId:id}}}); },
        onFavourite: (id) => dispatch({type:ACTION_TYPES.TOGGLE_FAVOURITE,payload:id}),
        isFavourite: true,
      })),
    ),
  );

  // ── Enquiries ──
  if (tab === 'enquiries') {
    const selectedId = pSelectedId;
    const setSelectedId = setPSelectedId;
    const replyText = pReplyText;
    const setReplyText = setPReplyText;
    const sel = myEnquiries.find(e => e.id === selectedId);

    return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
      React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '24px' } }, 'My Enquiries'),
      myEnquiries.length === 0 ? React.createElement(EmptyState, { icon: Icons.mail(48, c.textMuted), title: 'No enquiries', description: 'Send an enquiry to a provider to get started.' }) :
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : selectedId ? '300px 1fr' : '1fr', gap: '16px' } },
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
          myEnquiries.map(e => React.createElement(Card, {
            key: e.id, hover: true, onClick: () => setSelectedId(e.id),
            style: { cursor: 'pointer', padding: '14px', border: selectedId === e.id ? `2px solid ${COLORS.primary[500]}` : undefined },
          },
            React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text } }, e.providerName),
            React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted } }, e.subject),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: '6px' } },
              React.createElement('span', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted } }, e.createdAt),
              React.createElement(Badge, { variant: e.status === 'active' ? 'success' : 'default', size: 'xs' }, e.status),
            ),
          )),
        ),
        sel && React.createElement(Card, { style: { display: 'flex', flexDirection: 'column', maxHeight: '600px' } },
          React.createElement('h3', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text, marginBottom: '4px' } }, sel.providerName),
          React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, marginBottom: '16px', paddingBottom: '12px', borderBottom: `1px solid ${c.border}` } }, sel.subject),
          React.createElement('div', { style: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' } },
            sel.messages.map((m, i) => React.createElement('div', { key: i, style: { display: 'flex', justifyContent: m.from === 'participant' ? 'flex-end' : 'flex-start' } },
              React.createElement('div', { style: { maxWidth: '80%' } },
                React.createElement('div', { style: { padding: '10px 14px', borderRadius: RADIUS.md, background: m.from === 'participant' ? COLORS.primary[500] : c.surfaceAlt, color: m.from === 'participant' ? '#fff' : c.text } },
                  m.text && React.createElement('p', { style: { fontSize: FONT_SIZES.sm } }, m.text),
                  m.attachment && React.createElement('div', {
                    style: {
                      display: 'flex', alignItems: 'center', gap: '8px', marginTop: m.text ? '8px' : '0',
                      padding: '8px 10px', borderRadius: RADIUS.sm,
                      background: m.from === 'participant' ? 'rgba(255,255,255,0.15)' : (theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                      cursor: 'pointer',
                    },
                    onClick: () => addToast(`Opening: ${m.attachment.name}`, 'info'),
                  },
                    Icons.fileText(16, m.from === 'participant' ? '#fff' : COLORS.primary[400]),
                    React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                      React.createElement('p', { style: { fontSize: FONT_SIZES.xs, fontWeight: 600, color: m.from === 'participant' ? '#fff' : c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, m.attachment.name),
                      React.createElement('p', { style: { fontSize: '10px', color: m.from === 'participant' ? 'rgba(255,255,255,0.7)' : c.textMuted } }, m.attachment.docType + (m.attachment.size ? ' · ' + m.attachment.size : '')),
                    ),
                    Icons.download(13, m.from === 'participant' ? 'rgba(255,255,255,0.7)' : c.textMuted),
                  ),
                  React.createElement('p', { style: { fontSize: FONT_SIZES.xs, marginTop: '4px', opacity: 0.7 } }, `${m.date} ${m.time}`),
                ),
              ),
            )),
          ),
          pAttachDoc && React.createElement('div', {
            style: { margin: '0 0 8px', padding: '8px 12px', background: `${COLORS.primary[500]}15`, borderRadius: RADIUS.md, display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${COLORS.primary[500]}40` },
          },
            Icons.fileText(14, COLORS.primary[400]),
            React.createElement('span', { style: { fontSize: FONT_SIZES.xs, fontWeight: 600, color: COLORS.primary[400], flex: 1 } }, pAttachDoc.name + ' (' + pAttachDoc.docType + ')'),
            React.createElement('button', { onClick: () => setPAttachDoc(null), style: { background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, display: 'flex' } }, Icons.x(12)),
          ),
          sel.status === 'active' && React.createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
            React.createElement('div', { style: { position: 'relative' } },
              React.createElement('button', {
                onClick: () => setShowDocPicker(!showDocPicker),
                title: 'Attach document',
                style: { background: 'none', border: `1px solid ${c.border}`, borderRadius: RADIUS.md, cursor: 'pointer', padding: '9px 10px', color: c.textSecondary, display: 'flex', alignItems: 'center' },
              }, Icons.paperclip(16)),
              showDocPicker && React.createElement('div', {
                style: {
                  position: 'absolute', bottom: '100%', left: 0, marginBottom: '4px',
                  background: c.surface, border: `1px solid ${c.border}`, borderRadius: RADIUS.md,
                  boxShadow: c.cardShadow, overflow: 'hidden', zIndex: 100, minWidth: '180px',
                },
              },
                React.createElement('p', { style: { fontSize: FONT_SIZES.xs, fontWeight: 700, color: c.textMuted, padding: '8px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Document Type'),
                ['Service Agreement', 'NDIS Plan', 'Invoice', 'Other'].map(docType => React.createElement('button', {
                  key: docType,
                  onClick: () => {
                    setPAttachDoc({ name: docType + '.pdf', docType });
                    setShowDocPicker(false);
                  },
                  style: { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: c.text, fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, textAlign: 'left' },
                  onMouseEnter: (e) => e.currentTarget.style.background = c.surfaceHover,
                  onMouseLeave: (e) => e.currentTarget.style.background = 'none',
                }, Icons.fileText(14, COLORS.primary[400]), docType)),
              ),
            ),
            React.createElement('input', {
              value: replyText, onChange: e => setReplyText(e.target.value),
              placeholder: 'Type a reply...',
              onKeyDown: e => {
                if (e.key === 'Enter' && (replyText.trim() || pAttachDoc)) {
                  const msgPayload = { enquiryId: sel.id, text: replyText, from: 'participant' };
                  if (pAttachDoc) msgPayload.attachment = pAttachDoc;
                  dispatch({ type: ACTION_TYPES.REPLY_ENQUIRY, payload: msgPayload });
                  db.replyEnquiry(sel.id, replyText, 'participant');
                  setReplyText('');
                  setPAttachDoc(null);
                  addToast('Reply sent!', 'success');
                }
              },
              style: { flex: 1, padding: '10px 14px', background: c.surfaceAlt, border: `1px solid ${c.border}`, borderRadius: RADIUS.md, color: c.text, outline: 'none', fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm },
            }),
            React.createElement(Button, {
              variant: 'primary', size: 'sm',
              onClick: () => {
                if (replyText.trim() || pAttachDoc) {
                  const msgPayload = { enquiryId: sel.id, text: replyText, from: 'participant' };
                  if (pAttachDoc) msgPayload.attachment = pAttachDoc;
                  dispatch({ type: ACTION_TYPES.REPLY_ENQUIRY, payload: msgPayload });
                  db.replyEnquiry(sel.id, replyText, 'participant');
                  setReplyText('');
                  setPAttachDoc(null);
                  addToast('Reply sent!', 'success');
                }
              },
              icon: Icons.send(16, '#fff'),
            }),
          ),
        ),
      ),
    );
  }

  // ── Bookings ──
  if (tab === 'bookings') {
    const NDIS_ITEMS = {
      'Daily Living Support': { code: '01_011_0107_1_1', rate: 67.56 },
      'Hydrotherapy Session': { code: '15_043_0128_1_3', rate: 145.20 },
      'Psychology - CBT': { code: '15_056_0128_1_3', rate: 214.41 },
      'Psychology Session': { code: '15_056_0128_1_3', rate: 214.41 },
      'Multidisciplinary Assessment': { code: '15_037_0128_1_3', rate: 193.99 },
      'Transport to Appointment': { code: '02_051_0108_1_1', rate: 32.00 },
      'Employment Coaching': { code: '13_025_0133_1_3', rate: 89.50 },
      'Nursing Visit': { code: '07_004_0103_1_1', rate: 128.93 },
      'SIL Support': { code: '01_012_0115_1_1', rate: 3000.00 },
      'Speech Therapy': { code: '15_054_0128_1_3', rate: 193.99 },
      'Community Participation': { code: '04_210_0125_6_1', rate: 67.56 },
      'Group Activity': { code: '04_104_0125_6_1', rate: 34.00 },
      'Plan Review Meeting': { code: '07_002_0106_8_3', rate: 74.00 },
      'Paediatric Physio': { code: '15_043_0128_1_3', rate: 145.20 },
    };
    const getRate = (b) => {
      const item = NDIS_ITEMS[b.service];
      return item ? item.rate : 65.00;
    };
    const getLineItemCode = (b) => {
      const item = NDIS_ITEMS[b.service];
      return item ? item.code : '01_011_0107_1_1';
    };
    const calcBookingAmount = (b) => {
      const rate = getRate(b);
      const d = b.duration || '1 hour';
      if (d.includes('24 hours')) return rate * 24;
      if (d.includes('4 hours')) return rate * 4;
      if (d.includes('3 hours')) return rate * 3;
      if (d.includes('2 hours')) return rate * 2;
      if (d.includes('1.5')) return rate * 1.5;
      if (d.includes('45 min')) return rate * 0.75;
      if (d.includes('30 min')) return rate * 0.5;
      return rate;
    };

    return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
      React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '24px' } }, 'My Bookings'),
      myBookings.length === 0 ? React.createElement(EmptyState, { icon: Icons.calendar(48, c.textMuted), title: 'No bookings', description: 'Book an appointment with a Premium provider.' }) :
      React.createElement('div', { style: { display: 'grid', gap: '12px' } },
        myBookings.map(b => React.createElement(Card, { key: b.id },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' } },
            React.createElement('div', null,
              React.createElement('h4', { style: { fontSize: FONT_SIZES.base, fontWeight: 600, color: c.text } }, b.providerName),
              React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary } }, b.service),
            ),
            React.createElement(Badge, { variant: b.status === 'confirmed' ? 'success' : b.status === 'pending' ? 'warning' : 'error', size: 'xs' }, b.status),
          ),
          React.createElement('div', { style: { display: 'flex', gap: '16px', flexWrap: 'wrap' } },
            React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: FONT_SIZES.sm, color: c.textSecondary } }, Icons.calendar(14), b.date),
            React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: FONT_SIZES.sm, color: c.textSecondary } }, Icons.clock(14), b.time),
            React.createElement('span', { style: { fontSize: FONT_SIZES.sm, color: c.textMuted } }, b.duration),
          ),
          b.notes && React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, marginTop: '8px' } }, b.notes),
          React.createElement('div', { style: { display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' } },
            (b.status === 'confirmed' || b.status === 'completed') && React.createElement(Button, {
              variant: 'secondary', size: 'sm',
              onClick: () => setReceiptBooking(b),
              icon: Icons.receipt(14, COLORS.primary[500]),
              style: { color: COLORS.primary[500] },
            }, 'View Receipt'),
            b.status !== 'cancelled' && React.createElement(Button, {
              variant: 'ghost', size: 'sm',
              onClick: () => { dispatch({type:ACTION_TYPES.CANCEL_BOOKING,payload:b.id}); db.updateBooking(b.id,{status:'cancelled'}); addToast('Booking cancelled','info'); },
              style: { color: COLORS.error },
            }, 'Cancel'),
          ),
        )),
      ),
      receiptBooking && React.createElement('div', {
        onClick: () => setReceiptBooking(null),
        style: { position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS[theme].overlay, animation: 'nc-fadeIn 0.2s ease' },
      },
        React.createElement('div', {
          onClick: (e) => e.stopPropagation(),
          style: {
            width: '90vw', maxWidth: '520px', background: c.surface,
            borderRadius: RADIUS.lg, boxShadow: c.cardShadow, border: `1px solid ${c.border}`,
            overflow: 'hidden', animation: 'nc-scaleIn 0.3s ease',
          },
        },
          // Receipt header
          React.createElement('div', { style: { background: COLORS.gradientPrimary, padding: '24px', color: '#fff' } },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' } },
              React.createElement('div', null,
                React.createElement('p', { style: { fontSize: FONT_SIZES.xs, opacity: 0.8, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' } }, 'Receipt'),
                React.createElement('h3', { style: { fontSize: FONT_SIZES.xl, fontWeight: 800 } }, 'NexaConnect'),
                React.createElement('p', { style: { fontSize: FONT_SIZES.sm, opacity: 0.8, marginTop: '2px' } }, 'NDIS Service Receipt'),
              ),
              React.createElement('div', { style: { textAlign: 'right' } },
                React.createElement('p', { style: { fontSize: FONT_SIZES.xs, opacity: 0.8 } }, 'Receipt #'),
                React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 700 } }, `NDIS-${receiptBooking.id.toUpperCase()}-${receiptBooking.date.replace(/-/g, '')}`),
              ),
            ),
          ),
          // Receipt body
          React.createElement('div', { style: { padding: '24px' } },
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${c.border}` } },
              React.createElement('div', null,
                React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Provider'),
                React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 700, color: c.text } }, receiptBooking.providerName),
              ),
              React.createElement('div', null,
                React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Participant'),
                React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 700, color: c.text } }, participant.name),
              ),
              React.createElement('div', null,
                React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Date'),
                React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.text } }, receiptBooking.date),
              ),
              React.createElement('div', null,
                React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Time'),
                React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.text } }, receiptBooking.time),
              ),
            ),
            // Line item
            React.createElement('div', { style: { marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${c.border}` } },
              React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' } },
                React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Service'),
                React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Amount'),
              ),
              React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: c.surfaceAlt, borderRadius: RADIUS.md } },
                React.createElement('div', null,
                  React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text } }, receiptBooking.service),
                  React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, marginTop: '2px' } }, `NDIS Line Item: ${getLineItemCode(receiptBooking)}`),
                  React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted } }, `Duration: ${receiptBooking.duration} · Rate: $${getRate(receiptBooking).toFixed(2)}/hr`),
                ),
                React.createElement('p', { style: { fontSize: FONT_SIZES.lg, fontWeight: 800, color: c.text } }, `$${calcBookingAmount(receiptBooking).toFixed(2)}`),
              ),
            ),
            // Total
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' } },
              React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary } }, 'GST (included)'),
              React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary } }, `$${(calcBookingAmount(receiptBooking) / 11).toFixed(2)}`),
            ),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: `2px solid ${c.border}`, marginBottom: '20px' } },
              React.createElement('p', { style: { fontSize: FONT_SIZES.base, fontWeight: 800, color: c.text } }, 'Total (NDIS Funded)'),
              React.createElement('p', { style: { fontSize: FONT_SIZES.xl, fontWeight: 900, ...gradientText() } }, `$${calcBookingAmount(receiptBooking).toFixed(2)}`),
            ),
            // Plan type badge
            React.createElement('div', { style: { background: `${COLORS.success}15`, padding: '8px 12px', borderRadius: RADIUS.md, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' } },
              Icons.checkCircle(14, COLORS.success),
              React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: COLORS.success, fontWeight: 600 } }, `Funding Type: ${participant.planType || 'NDIS Funded'}`),
            ),
            // Buttons
            React.createElement('div', { style: { display: 'flex', gap: '8px' } },
              React.createElement(Button, {
                variant: 'primary', size: 'sm', fullWidth: true,
                icon: Icons.download(15, '#fff'),
                onClick: () => addToast('PDF download coming soon', 'info'),
              }, 'Download PDF'),
              React.createElement(Button, { variant: 'secondary', size: 'sm', onClick: () => setReceiptBooking(null) }, 'Close'),
            ),
          ),
        ),
      ),
    );
  }

  // ── My Reviews ──
  if (tab === 'my-reviews') return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
    React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '24px' } }, 'My Reviews'),
    myReviews.length === 0 ? React.createElement(EmptyState, { icon: Icons.star(48, c.textMuted), title: 'No reviews yet', description: 'Leave a review for providers you have used.' }) :
    myReviews.map(r => {
      const prov = state.providers.find(p => p.id === r.providerId);
      return React.createElement(Card, { key: r.id, style: { marginBottom: '12px' } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' } },
          React.createElement('div', null,
            React.createElement('p', { style: { fontSize: FONT_SIZES.base, fontWeight: 600, color: c.text } }, prov?.name || 'Provider'),
            React.createElement(StarRating, { rating: r.rating, size: 14 }),
          ),
          React.createElement('span', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted } }, r.date),
        ),
        React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary, lineHeight: 1.6 } }, r.text),
        r.response && React.createElement('div', { style: { marginTop: '12px', padding: '12px', borderRadius: RADIUS.md, background: c.surfaceAlt, borderLeft: `3px solid ${COLORS.primary[500]}` } },
          React.createElement('p', { style: { fontSize: FONT_SIZES.xs, fontWeight: 600, color: COLORS.primary[500], marginBottom: '4px' } }, 'Provider Response'),
          React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary } }, r.response),
        ),
      );
    }),
  );

  // ── Settings ──
  if (tab === 'settings') {
    const editData = pEditData;
    const setEditData = setPEditData;
    return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px', maxWidth: '600px' } },
      React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '24px' } }, 'Settings'),
      React.createElement(Card, null,
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' } },
          React.createElement(Avatar, { name: participant.name, size: 64 }),
          React.createElement('div', null,
            React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text } }, participant.name),
            React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textMuted } }, participant.email),
          ),
        ),
        React.createElement(Input, { label: 'Name', value: editData.name || '', onChange: v => setEditData(p=>({...p,name:v})) }),
        React.createElement(Select, { label: 'Suburb', value: editData.suburb || '', onChange: v => setEditData(p=>({...p,suburb:v})),
          options: [{value:'',label:'Select'},...SUBURBS.map(s=>({value:s,label:s}))] }),
        React.createElement(Button, { variant: 'primary', onClick: async () => {
          dispatch({type:ACTION_TYPES.UPDATE_PARTICIPANT_PROFILE,payload:{id:participant.id,...editData}});
          if (isSupabaseConfigured() && participant.id && !participant.id.startsWith('u')) {
            await db.updateParticipant(participant.id, editData);
          }
          addToast('Profile updated!','success');
        } }, 'Save Changes'),
      ),
    );
  }

  return null;
}


/* ═══════════════════════════════════════════════════════════════
   Phase 8: Admin Panel
   ═══════════════════════════════════════════════════════════════ */

function AdminDashboard() {
  const { theme } = useTheme();
  const { state, dispatch } = useApp();
  const responsive = useResponsive();
  const c = COLORS[theme];
  const tab = state.dashboardTab;

  // All useState hooks must be called unconditionally (React Rules of Hooks)
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminFilterRole, setAdminFilterRole] = useState('all');

  const totalProviders = state.providers.length;
  const totalParticipants = state.participants.length;
  const premiumCount = state.providers.filter(p => p.tier === 'premium').length;
  const proCount = state.providers.filter(p => p.tier === 'professional').length;
  const freeCount = state.providers.filter(p => p.tier === 'starter').length;
  const mrr = premiumCount * 149 + proCount * 49;

  const revenueData = ANALYTICS_MONTHS.map((m, i) => ({
    month: m,
    revenue: Math.floor(mrr * (0.7 + i * 0.05 + Math.random() * 0.1)),
    providers: Math.floor(totalProviders * (0.6 + i * 0.06)),
    participants: Math.floor(totalParticipants * (0.5 + i * 0.07)),
  }));

  const subData = [
    { name: 'Premium', value: premiumCount, color: '#F59E0B' },
    { name: 'Professional', value: proCount, color: COLORS.primary[500] },
    { name: 'Starter', value: freeCount, color: COLORS.accent[500] },
  ];

  // ── Overview ──
  if (tab === 'overview') return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
    React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '24px' } }, 'Admin Dashboard'),

    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' } },
      React.createElement(StatCard, { icon: Icons.briefcase(20, COLORS.primary[500]), label: 'Total Providers', value: totalProviders, change: 12, trend: 'up' }),
      React.createElement(StatCard, { icon: Icons.users(20, COLORS.accent[500]), label: 'Total Participants', value: totalParticipants, change: 18, trend: 'up' }),
      React.createElement(StatCard, { icon: Icons.dollarSign(20, COLORS.success), label: 'Monthly Revenue', value: `$${mrr.toLocaleString()}`, change: 15, trend: 'up' }),
      React.createElement(StatCard, { icon: Icons.trendingUp(20, COLORS.primary[400]), label: 'Active Subs', value: premiumCount + proCount, change: 8, trend: 'up' }),
    ),

    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '24px' } },
      // Revenue Chart
      React.createElement(Card, null,
        React.createElement('h3', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text, marginBottom: '16px' } }, 'Revenue Trend'),
        React.createElement(ResponsiveContainer, { width: '100%', height: 250 },
          React.createElement(AreaChart, { data: revenueData },
            React.createElement(CartesianGrid, { strokeDasharray: '3 3', stroke: c.border }),
            React.createElement(XAxis, { dataKey: 'month', stroke: c.textMuted, fontSize: 12 }),
            React.createElement(YAxis, { stroke: c.textMuted, fontSize: 12 }),
            React.createElement(Tooltip, { contentStyle: { background: c.surface, border: `1px solid ${c.border}`, borderRadius: RADIUS.md }, formatter: (v) => `$${v}` }),
            React.createElement(Area, { type: 'monotone', dataKey: 'revenue', stroke: COLORS.primary[500], fill: `${COLORS.primary[500]}20`, strokeWidth: 2 }),
          ),
        ),
      ),
      // Subscription Dist
      React.createElement(Card, null,
        React.createElement('h3', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text, marginBottom: '16px' } }, 'Subscription Distribution'),
        React.createElement(ResponsiveContainer, { width: '100%', height: 250 },
          React.createElement(PieChart, null,
            React.createElement(Pie, { data: subData, dataKey: 'value', nameKey: 'name', cx: '50%', cy: '50%', outerRadius: 80, label: ({name,value}) => `${name}: ${value}` },
              subData.map((d, i) => React.createElement(Cell, { key: i, fill: d.color })),
            ),
            React.createElement(Tooltip),
          ),
        ),
      ),
      // User Growth
      React.createElement(Card, null,
        React.createElement('h3', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text, marginBottom: '16px' } }, 'User Growth'),
        React.createElement(ResponsiveContainer, { width: '100%', height: 250 },
          React.createElement(LineChart, { data: revenueData },
            React.createElement(CartesianGrid, { strokeDasharray: '3 3', stroke: c.border }),
            React.createElement(XAxis, { dataKey: 'month', stroke: c.textMuted, fontSize: 12 }),
            React.createElement(YAxis, { stroke: c.textMuted, fontSize: 12 }),
            React.createElement(Tooltip, { contentStyle: { background: c.surface, border: `1px solid ${c.border}`, borderRadius: RADIUS.md } }),
            React.createElement(Line, { type: 'monotone', dataKey: 'providers', stroke: COLORS.primary[500], strokeWidth: 2, name: 'Providers' }),
            React.createElement(Line, { type: 'monotone', dataKey: 'participants', stroke: COLORS.accent[500], strokeWidth: 2, name: 'Participants' }),
            React.createElement(Legend),
          ),
        ),
      ),
      // Recent Activity
      React.createElement(Card, null,
        React.createElement('h3', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text, marginBottom: '16px' } }, 'Recent Activity'),
        [
          { text: 'New provider registered: Sunshine Support', time: '2 hours ago', type: 'info', providerName: 'Sunshine Support' },
          { text: 'Premium upgrade: PhysioPlus Disability', time: '4 hours ago', type: 'success', providerName: 'PhysioPlus Disability' },
          { text: 'New review submitted for MindBridge', time: '6 hours ago', type: 'info', providerName: 'MindBridge' },
          { text: 'New participant: Sarah Mitchell', time: '8 hours ago', type: 'info' },
          { text: 'Booking confirmed: Little Stars', time: '12 hours ago', type: 'success', providerName: 'Little Stars' },
          { text: 'Support ticket: Plan management query', time: '1 day ago', type: 'warning' },
        ].map((a, i) => {
          const matchedProvider = a.providerName ? state.providers.find(p => p.name.toLowerCase().includes(a.providerName.toLowerCase())) : null;
          return React.createElement('div', {
            key: i,
            onClick: matchedProvider ? () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'provider-profile',params:{providerId:matchedProvider.id}}}) : undefined,
            style: { display: 'flex', gap: '10px', padding: '8px 4px', borderBottom: i < 5 ? `1px solid ${c.border}` : 'none', cursor: matchedProvider ? 'pointer' : 'default', borderRadius: RADIUS.sm, transition: 'background 0.2s' },
            onMouseEnter: matchedProvider ? (ev) => ev.currentTarget.style.background = c.surfaceHover : undefined,
            onMouseLeave: matchedProvider ? (ev) => ev.currentTarget.style.background = 'transparent' : undefined,
          },
            React.createElement('div', { style: { width: 8, height: 8, borderRadius: '50%', marginTop: '6px', flexShrink: 0, background: a.type === 'success' ? COLORS.success : a.type === 'warning' ? COLORS.warning : COLORS.info } }),
            React.createElement('div', { style: { flex: 1 } },
              React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.text } }, a.text),
              React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted } }, a.time),
            ),
          );
        }),
      ),
    ),
  );

  // ── Users Tab ──
  if (tab === 'users') {
    const searchTerm = adminSearchTerm;
    const setSearchTerm = setAdminSearchTerm;
    const filterRole = adminFilterRole;
    const setFilterRole = setAdminFilterRole;
    const allUsers = [
      ...state.providers.map(p => ({ ...p, role: 'provider' })),
      ...state.participants.map(p => ({ ...p, role: 'participant' })),
    ].filter(u => {
      if (filterRole !== 'all' && u.role !== filterRole) return false;
      if (searchTerm && !u.name.toLowerCase().includes(searchTerm.toLowerCase()) && !u.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
      React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '24px' } }, 'User Management'),
      React.createElement('div', { style: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' } },
        React.createElement('div', { style: { flex: 1, minWidth: '200px' } },
          React.createElement(SearchBar, { value: searchTerm, onChange: setSearchTerm, placeholder: 'Search users...' }),
        ),
        React.createElement('div', { style: { display: 'flex', gap: '6px' } },
          ['all','provider','participant'].map(r => React.createElement(FilterChip, { key: r, label: r.charAt(0).toUpperCase() + r.slice(1), active: filterRole === r, onClick: () => setFilterRole(r) })),
        ),
      ),
      React.createElement(Card, { style: { overflow: 'auto' } },
        React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse' } },
          React.createElement('thead', null,
            React.createElement('tr', null,
              ['Name','Email','Role','Status','Actions'].map(h => React.createElement('th', { key: h, style: { textAlign: 'left', padding: '10px 12px', fontSize: FONT_SIZES.xs, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', borderBottom: `1px solid ${c.border}` } }, h)),
            ),
          ),
          React.createElement('tbody', null,
            allUsers.slice(0, 20).map(u => React.createElement('tr', { key: u.id },
              React.createElement('td', { style: { padding: '10px 12px', borderBottom: `1px solid ${c.border}` } },
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
                  React.createElement(Avatar, { name: u.name, size: 28 }),
                  React.createElement('span', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text } }, u.name),
                ),
              ),
              React.createElement('td', { style: { padding: '10px 12px', borderBottom: `1px solid ${c.border}`, fontSize: FONT_SIZES.sm, color: c.textSecondary } }, u.email),
              React.createElement('td', { style: { padding: '10px 12px', borderBottom: `1px solid ${c.border}` } },
                React.createElement(Badge, { variant: u.role === 'provider' ? 'default' : 'info', size: 'xs' }, u.role),
                u.tier && React.createElement(Badge, { variant: u.tier, size: 'xs', style: { marginLeft: '4px' } }, u.tier),
              ),
              React.createElement('td', { style: { padding: '10px 12px', borderBottom: `1px solid ${c.border}` } },
                React.createElement(Badge, { variant: 'success', size: 'xs' }, 'Active'),
              ),
              React.createElement('td', { style: { padding: '10px 12px', borderBottom: `1px solid ${c.border}` } },
                React.createElement('div', { style: { display: 'flex', gap: '6px' } },
                  u.role === 'provider' && React.createElement(Button, {
                    variant: 'ghost', size: 'sm',
                    onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'provider-profile',params:{providerId:u.id}}}),
                  }, 'View'),
                  React.createElement(Button, {
                    variant: 'ghost', size: 'sm',
                    onClick: () => dispatch({type:ACTION_TYPES.SUSPEND_USER,payload:u.id}),
                    style: { color: COLORS.warning },
                  }, 'Suspend'),
                ),
              ),
            )),
          ),
        ),
      ),
    );
  }

  // ── Providers Management ──
  if (tab === 'providers-mgmt') return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
    React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '24px' } }, 'Provider Management'),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' } },
      React.createElement(StatCard, { label: 'Premium', value: premiumCount, icon: Icons.crown(20, '#F59E0B') }),
      React.createElement(StatCard, { label: 'Professional', value: proCount, icon: Icons.award(20, COLORS.primary[500]) }),
      React.createElement(StatCard, { label: 'Starter', value: freeCount, icon: Icons.user(20, c.textMuted) }),
    ),
    React.createElement('div', { style: { display: 'grid', gap: '12px' } },
      state.providers.map(p => React.createElement(Card, {
        key: p.id,
        onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'provider-profile',params:{providerId:p.id}}}),
        style: { cursor: 'pointer' },
      },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          React.createElement('div', { style: { display: 'flex', gap: '12px', alignItems: 'center' } },
            React.createElement(Avatar, { name: p.name, size: 36 }),
            React.createElement('div', null,
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
                React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text } }, p.name),
                p.verified && Icons.verified(14, COLORS.accent[500]),
              ),
              React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted } }, `${p.suburb} | ${p.tier}`),
            ),
          ),
          React.createElement('div', { style: { display: 'flex', gap: '6px', alignItems: 'center' } },
            React.createElement(Badge, { variant: p.tier, size: 'xs' }, p.tier),
            React.createElement(StarRating, { rating: p.rating, size: 12 }),
          ),
        ),
      )),
    ),
  );

  // ── Revenue Tab ──
  if (tab === 'revenue') return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
    React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '24px' } }, 'Revenue'),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' } },
      React.createElement(StatCard, { icon: Icons.dollarSign(20, COLORS.success), label: 'MRR', value: `$${mrr.toLocaleString()}` }),
      React.createElement(StatCard, { icon: Icons.trendingUp(20, COLORS.primary[500]), label: 'ARR', value: `$${(mrr*12).toLocaleString()}` }),
      React.createElement(StatCard, { icon: Icons.creditCard(20, COLORS.accent[500]), label: 'Avg Revenue/Provider', value: `$${Math.round(mrr / Math.max(premiumCount+proCount, 1))}` }),
    ),
    React.createElement(Card, null,
      React.createElement('h3', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text, marginBottom: '16px' } }, 'Revenue Over Time'),
      React.createElement(ResponsiveContainer, { width: '100%', height: 300 },
        React.createElement(AreaChart, { data: revenueData },
          React.createElement(CartesianGrid, { strokeDasharray: '3 3', stroke: c.border }),
          React.createElement(XAxis, { dataKey: 'month', stroke: c.textMuted, fontSize: 12 }),
          React.createElement(YAxis, { stroke: c.textMuted, fontSize: 12 }),
          React.createElement(Tooltip, { contentStyle: { background: c.surface, border: `1px solid ${c.border}`, borderRadius: RADIUS.md }, formatter: v => `$${v}` }),
          React.createElement(Area, { type: 'monotone', dataKey: 'revenue', stroke: COLORS.primary[500], fill: `${COLORS.primary[500]}20`, strokeWidth: 2 }),
        ),
      ),
    ),
  );

  // ── Reports Tab ──
  if (tab === 'reports') {
    const reports = state.reports || [];
    const statusColors = { pending: COLORS.warning, reviewed: COLORS.info, resolved: COLORS.success };
    return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' } },
        React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text } }, 'Provider Reports'),
        React.createElement('div', { style: { display: 'flex', gap: '8px' } },
          React.createElement(Badge, { variant: 'warning', size: 'xs' }, reports.filter(r => r.status === 'pending').length + ' Pending'),
          React.createElement(Badge, { variant: 'info', size: 'xs' }, reports.filter(r => r.status === 'reviewed').length + ' Reviewed'),
          React.createElement(Badge, { variant: 'success', size: 'xs' }, reports.filter(r => r.status === 'resolved').length + ' Resolved'),
        ),
      ),
      reports.length === 0
        ? React.createElement(EmptyState, { icon: Icons.flag(48, c.textMuted), title: 'No reports yet', description: 'Provider reports submitted by participants will appear here.' })
        : React.createElement('div', { style: { display: 'grid', gap: '12px' } },
            reports.map(r => React.createElement(Card, { key: r.id },
              React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' } },
                React.createElement('div', null,
                  React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' } },
                    React.createElement('p', { style: { fontSize: FONT_SIZES.sm, fontWeight: 700, color: c.text } }, r.providerName),
                    React.createElement(Badge, { size: 'xs', style: { background: `${statusColors[r.status]}20`, color: statusColors[r.status], border: `1px solid ${statusColors[r.status]}40` } }, r.status.charAt(0).toUpperCase() + r.status.slice(1)),
                  ),
                  React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted } }, `Report ID: ${r.id} · Submitted: ${r.submittedAt}`),
                ),
                React.createElement('div', { style: { display: 'flex', gap: '6px' } },
                  r.status === 'pending' && React.createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => dispatch({ type: ACTION_TYPES.UPDATE_REPORT_STATUS, payload: { id: r.id, status: 'reviewed' } }) }, 'Mark Reviewed'),
                  r.status !== 'resolved' && React.createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => dispatch({ type: ACTION_TYPES.UPDATE_REPORT_STATUS, payload: { id: r.id, status: 'resolved' } }), style: { color: COLORS.success } }, 'Resolve'),
                ),
              ),
              React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' } },
                React.createElement('div', null,
                  React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, textTransform: 'uppercase', fontWeight: 700 } }, 'Reason'),
                  React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.text, fontWeight: 600 } },
                    r.reason === 'misconduct' ? 'Misconduct or unprofessional behaviour' :
                    r.reason === 'inaccurate' ? 'Inaccurate or misleading information' :
                    r.reason === 'safety' ? 'Safety concern' :
                    r.reason === 'fraud' ? 'Suspected fraud' : 'Other'),
                ),
                r.notes && React.createElement('div', null,
                  React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, textTransform: 'uppercase', fontWeight: 700 } }, 'Details'),
                  React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary } }, r.notes),
                ),
              ),
              React.createElement('div', { style: { marginTop: '10px', display: 'flex', gap: '8px' } },
                React.createElement(Button, {
                  variant: 'ghost', size: 'sm',
                  onClick: () => dispatch({ type: ACTION_TYPES.NAV_GOTO, payload: { route: 'provider-profile', params: { providerId: r.providerId } } }),
                }, 'View Provider Profile'),
              ),
            )),
          ),
    );
  }

  // ── Activity Tab ──
  if (tab === 'activity') return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
    React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '24px' } }, 'Activity Feed'),
    React.createElement(Card, null,
      [
        { text: 'Sarah Mitchell sent an enquiry to Sunshine Support', time: '30 minutes ago', type: 'info', providerName: 'Sunshine Support' },
        { text: 'PhysioPlus Disability upgraded to Premium plan', time: '1 hour ago', type: 'success', providerName: 'PhysioPlus' },
        { text: 'New review: 5 stars for MindBridge Psychology', time: '2 hours ago', type: 'success', providerName: 'MindBridge' },
        { text: 'James Chen booked hydrotherapy at PhysioPlus', time: '3 hours ago', type: 'info', providerName: 'PhysioPlus' },
        { text: 'New provider registered: Garden Therapy Co', time: '5 hours ago', type: 'info' },
        { text: 'CareFirst Plan Management responded to review', time: '6 hours ago', type: 'info', providerName: 'CareFirst' },
        { text: 'Booking cancelled: Happy Days Community', time: '8 hours ago', type: 'warning', providerName: 'Happy Days' },
        { text: 'New participant: Emma Johnson from Merewether', time: '10 hours ago', type: 'info' },
        { text: 'Little Stars Early Intervention hit 50 reviews', time: '12 hours ago', type: 'success', providerName: 'Little Stars' },
        { text: 'Harmony SIL Homes updated their profile', time: '1 day ago', type: 'info', providerName: 'Harmony' },
        { text: 'TechAssist AT Solutions added new photos', time: '1 day ago', type: 'info', providerName: 'TechAssist' },
        { text: 'Monthly billing processed: $2,847 collected', time: '2 days ago', type: 'success' },
      ].map((a, i) => {
        const matchedProvider = a.providerName ? state.providers.find(p => p.name.toLowerCase().includes(a.providerName.toLowerCase())) : null;
        return React.createElement('div', {
          key: i,
          onClick: matchedProvider ? () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'provider-profile',params:{providerId:matchedProvider.id}}}) : undefined,
          style: { display: 'flex', gap: '12px', padding: '12px 4px', borderBottom: `1px solid ${c.border}`, cursor: matchedProvider ? 'pointer' : 'default', borderRadius: RADIUS.sm, transition: 'background 0.2s' },
          onMouseEnter: matchedProvider ? (ev) => ev.currentTarget.style.background = c.surfaceHover : undefined,
          onMouseLeave: matchedProvider ? (ev) => ev.currentTarget.style.background = 'transparent' : undefined,
        },
          React.createElement('div', { style: { width: 10, height: 10, borderRadius: '50%', marginTop: '5px', flexShrink: 0, background: a.type === 'success' ? COLORS.success : a.type === 'warning' ? COLORS.warning : COLORS.info } }),
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.text } }, a.text),
            React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, marginTop: '2px' } }, a.time),
          ),
        );
      }),
    ),
  );

  return null;
}


/* ═══════════════════════════════════════════════════════════════
   Static Info Pages
   ═══════════════════════════════════════════════════════════════ */

const INFO_PAGES = {
  help: {
    title: 'Help Centre',
    sections: [
      { heading: 'Getting Started', content: 'NexaConnect makes it easy to find and connect with NDIS providers in your area. Simply browse our directory, filter by service type and location, and send an enquiry directly to providers you\'re interested in.' },
      { heading: 'How do I find a provider?', content: 'Use the Browse Directory feature to search by service category, suburb, rating, and more. You can also filter by plan type (self-managed, plan-managed, or NDIA-managed) to find providers that accept your funding type.' },
      { heading: 'How do I send an enquiry?', content: 'Visit any provider\'s profile page and click the "Enquire" button. You\'ll need to be logged in as a participant. Your message will be sent directly to the provider and you can track responses in your dashboard.' },
      { heading: 'How do bookings work?', content: 'Premium providers offer direct booking through NexaConnect. Visit their profile, click "Book", and select your preferred date and time. The provider will confirm or suggest an alternative.' },
      { heading: 'How do I leave a review?', content: 'After interacting with a provider, visit their profile and go to the Reviews tab. Click "Write Review" to share your experience and help other participants make informed decisions.' },
      { heading: 'Account & Settings', content: 'Manage your profile, notification preferences, and account settings from your dashboard. Providers can edit their profile, manage subscriptions, and track analytics from their provider dashboard.' },
    ],
  },
  contact: {
    title: 'Contact Us',
    sections: [
      { heading: 'Get in Touch', content: 'We\'d love to hear from you. Whether you have a question about the platform, need help with your account, or want to provide feedback, our team is here to help.' },
      { heading: 'Email', content: 'support@nexaconnect.com.au — We aim to respond within 24 hours on business days.' },
      { heading: 'Phone', content: '1800 NEXA CONNECT (1800 639 226) — Available Monday to Friday, 9am – 5pm AEST.' },
      { heading: 'Office', content: 'NexaConnect Pty Ltd\nLevel 2, 45 Hunter Street\nNewcastle NSW 2300\nAustralia' },
      { heading: 'For Providers', content: 'Interested in listing your services on NexaConnect? Register as a provider to get started with our free Starter plan, or contact our partnerships team at partners@nexaconnect.com.au for more information about Premium features.' },
      { heading: 'Report an Issue', content: 'If you\'ve encountered a technical issue or need to report inappropriate content, please email us at support@nexaconnect.com.au with details and we\'ll investigate promptly.' },
    ],
  },
  'ndis-resources': {
    title: 'NDIS Resources',
    sections: [
      { heading: 'Understanding the NDIS', content: 'The National Disability Insurance Scheme (NDIS) provides funding to eligible Australians with a permanent and significant disability. It helps participants access the reasonable and necessary supports they need to live an ordinary life.' },
      { heading: 'NDIS Official Website', content: 'Visit the official NDIS website at ndis.gov.au for comprehensive information about eligibility, planning, and accessing supports.' },
      { heading: 'Plan Management Options', content: 'NDIS participants can choose how their funding is managed:\n\n• Self-Managed — You manage your own funding and pay providers directly.\n• Plan-Managed — A plan manager handles payments and financial reporting on your behalf.\n• NDIA-Managed — The NDIA pays providers directly from your plan.' },
      { heading: 'Finding the Right Provider', content: 'When choosing a provider, consider their experience with your specific needs, location, availability, and reviews from other participants. NexaConnect makes this process easier with verified reviews, detailed profiles, and direct enquiry features.' },
      { heading: 'Useful Links', content: '• NDIS — ndis.gov.au\n• NDIS Quality & Safeguards Commission — ndiscommission.gov.au\n• Disability Gateway — disabilitygateway.gov.au\n• NDIS Plan Management — ndis.gov.au/participants/using-your-plan/managing-your-plan' },
      { heading: 'Need Help with Your Plan?', content: 'If you need assistance understanding your NDIS plan or finding appropriate providers, Local Area Coordinators (LACs) can help. Contact the NDIS on 1800 800 110 for more information.' },
    ],
  },
  about: {
    title: 'About NexaConnect',
    sections: [
      { heading: 'Our Mission', content: 'NexaConnect is Australia\'s dedicated NDIS provider marketplace, built to bridge the gap between participants seeking quality disability services and providers ready to deliver them. We believe everyone deserves easy access to the support they need.' },
      { heading: 'Why NexaConnect?', content: 'Navigating the NDIS provider landscape can be overwhelming. NexaConnect simplifies this by offering a curated, searchable directory of verified providers with real reviews, direct enquiry capabilities, and transparent service information — all in one place.' },
      { heading: 'How It Works', content: 'Participants can search for providers by service type, location, and availability. Send enquiries directly, read genuine reviews from other participants, and book appointments with Premium providers — all through our secure platform.' },
      { heading: 'For Providers', content: 'NexaConnect helps disability service providers grow their business by increasing visibility to NDIS participants actively seeking services. Our tiered subscription model offers analytics, priority listings, and direct booking features to help you stand out.' },
      { heading: 'Our Story', content: 'Founded in Newcastle, Australia, NexaConnect was born from the firsthand experience of navigating the NDIS system. We saw the need for a modern, user-friendly platform that puts participants and providers in direct contact, and we built it.' },
      { heading: 'Our Values', content: '• Accessibility — Technology should make life easier for people with disability, not harder.\n• Transparency — Real reviews, verified providers, and clear pricing.\n• Community — We\'re building a connected community of participants and providers.\n• Quality — We hold our platform and listed providers to the highest standards.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      { heading: 'Introduction', content: 'NexaConnect Pty Ltd (ABN pending) ("we", "our", "us") is committed to protecting the privacy of your personal information in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).\n\nThis Policy explains how we collect, use, disclose, store, and safeguard your personal information when you use the NexaConnect platform. By creating an account or using the Platform, you consent to the practices described in this Policy.\n\nLast updated: February 2026.' },
      { heading: '1. What Information We Collect', content: 'Identity and Contact Information\n\u2022 Full name, date of birth, email address, phone number, and postal address\n\u2022 Profile photograph (optional)\n\nSensitive Information \u2014 Disability and NDIS Data (APP 3)\n\u2022 NDIS participant number (where provided by participants)\n\u2022 Disability-related information you choose to share in your profile or enquiries\n\u2022 Support needs and service preferences\n\nProvider Business Information\n\u2022 Business name, ABN, NDIS registration number, and registration groups\n\u2022 Worker Screening Check numbers and compliance documentation\n\u2022 Qualifications, insurance certificates, and service descriptions\n\nPayment Information\n\u2022 Subscription billing is processed by Stripe, Inc. We do not store full credit card numbers. We retain only a tokenised payment reference provided by Stripe.\n\nTechnical and Usage Data\n\u2022 IP address, browser type, device identifiers, pages visited, and time on Platform\n\u2022 Cookies and similar tracking technologies (see Section 10)' },
      { heading: '2. Why We Collect Your Information', content: 'We collect and use your personal information to:\n\u2022 Create and manage your account and verify your identity\n\u2022 Connect NDIS participants with suitable service providers (our core service)\n\u2022 Facilitate enquiries, bookings, and communications between participants and providers\n\u2022 Process subscription payments for provider accounts via Stripe\n\u2022 Display verified reviews and ratings to assist participant decision-making\n\u2022 Send service-related notifications, booking confirmations, and account updates\n\u2022 Ensure platform safety, verify provider credentials, and detect fraud\n\u2022 Comply with obligations under the NDIS Quality and Safeguards Framework and the Privacy Act\n\u2022 Improve and personalise the Platform through analytics and research\n\nWhere we use your information for a secondary purpose, we will seek your consent unless an exception under the Privacy Act applies.' },
      { heading: '3. How We Store Your Information', content: 'Data Storage and Infrastructure\nYour personal information is stored on Supabase (supabase.com), a cloud database platform hosted in Australia (Sydney region, AWS ap-southeast-2). Supabase applies AES-256 encryption at rest and TLS 1.2+ encryption in transit.\n\nAccess Controls\nAccess to personal data is restricted on a need-to-know basis. Row-level security policies ensure users can only access their own records.\n\nRetention Periods\n\u2022 Active account data: Duration of account plus 7 years\n\u2022 Deleted account data: Anonymised or deleted within 90 days of account closure\n\u2022 Enquiry and communication records: 2 years after last activity\n\u2022 Payment records: 7 years (Corporations Act 2001 (Cth))\n\nAutomated daily backups are maintained and subject to the same security standards.' },
      { heading: '4. Disclosure to Third Parties', content: 'We do not sell, rent, or trade your personal information. We may share your information only with:\n\nStripe, Inc.\nSubscription payments are processed by Stripe under Stripe\'s Privacy Policy (stripe.com/privacy). Stripe is certified to PCI DSS Level 1. We receive only a tokenised payment reference.\n\nSupabase\nOur database infrastructure provider, operating under a Data Processing Agreement consistent with APP 8 cross-border disclosure requirements.\n\nLaw Enforcement and Regulatory Bodies\nWe will disclose information where required by law, court order, or a regulatory authority, including the NDIS Quality and Safeguards Commission and the Office of the Australian Information Commissioner (OAIC).\n\nBusiness Transfers\nIn the event of a merger, acquisition, or asset sale, personal information may transfer to the successor entity subject to equivalent privacy protections.\n\nWith Your Consent\nIn all other circumstances, we will obtain your explicit consent before disclosing your personal information to a third party.' },
      { heading: '5. Your Rights Under the Privacy Act', content: 'Under the Privacy Act 1988 (Cth) and the Australian Privacy Principles:\n\nRight of Access (APP 12)\nYou may request access to the personal information we hold about you. We will respond within 30 days. A reasonable fee may apply.\n\nRight of Correction (APP 13)\nIf information we hold is inaccurate, out of date, incomplete, or misleading, you may request correction. We will act within 30 days.\n\nRight to Anonymity / Pseudonymity (APP 2)\nWhere lawful and practicable, you may interact with us anonymously. Some features require accurate identity information.\n\nRight to Opt Out of Direct Marketing (APP 7)\nYou may opt out of marketing at any time by clicking "Unsubscribe" in any email or contacting privacy@nexaconnect.com.au.\n\nRight to Make a Complaint\nSee Section 9.\n\nTo exercise any right, contact our Privacy Officer:\nEmail: privacy@nexaconnect.com.au\nPost: Privacy Officer, NexaConnect Pty Ltd, Level 2, 45 Hunter Street, Newcastle NSW 2300' },
      { heading: '6. Notifiable Data Breaches', content: 'NexaConnect is subject to the Notifiable Data Breaches (NDB) scheme under Part IIIC of the Privacy Act 1988 (Cth).\n\nIf we become aware of a data breach likely to result in serious harm, we will:\n1. Assess the breach promptly (within 30 days of becoming aware)\n2. Notify affected individuals describing the breach, data types involved, and our response steps\n3. Notify the OAIC via the NDB notification form at oaic.gov.au\n\nIf you suspect your account has been compromised, contact us immediately at security@nexaconnect.com.au.' },
      { heading: '7. Children\'s Privacy', content: 'The Platform is not directed at children under 18. We do not knowingly collect personal information from under-18s without parental or guardian consent.\n\nNDIS participants who are minors must have a parent, legal guardian, or nominee manage their account. If we have inadvertently collected information from a child under 18 without appropriate consent, contact privacy@nexaconnect.com.au and we will delete it promptly.' },
      { heading: '8. Cross-Border Disclosure', content: 'Primary data storage is in Australia (Supabase, Sydney region). Some third-party service providers (including Stripe, headquartered in the United States) may process data outside Australia.\n\nBefore disclosing personal information to an overseas recipient, we take reasonable steps to ensure the recipient complies with the APPs, in accordance with APP 8.1.\n\nBy using the Platform you acknowledge and consent to such transfers. Contact us if you have concerns.' },
      { heading: '9. Privacy Complaints', content: 'Step 1 \u2014 Internal Complaint\nContact our Privacy Officer:\n\u2022 Email: privacy@nexaconnect.com.au\n\u2022 Post: Privacy Officer, NexaConnect Pty Ltd, Level 2, 45 Hunter Street, Newcastle NSW 2300\n\nWe will acknowledge within 5 business days and aim to resolve within 30 days.\n\nStep 2 \u2014 External Escalation\nIf unsatisfied with our response, or if we fail to respond within 30 days, escalate to the Office of the Australian Information Commissioner (OAIC):\n\u2022 Website: oaic.gov.au/privacy/privacy-complaints\n\u2022 Phone: 1300 363 992\n\u2022 Post: GPO Box 5218, Sydney NSW 2001' },
      { heading: '10. Cookies and Analytics', content: 'Essential Cookies\nRequired for core platform functionality \u2014 session management, authentication tokens, and security. These cannot be disabled without significantly impairing the Platform.\n\nAnalytics\nWe may use privacy-safe, aggregated analytics. Data is anonymised before transmission and no personally identifiable information is shared with analytics providers.\n\nNo Advertising Cookies\nWe do not use third-party advertising or behavioural tracking cookies and do not participate in cross-site advertising networks.\n\nYou can configure your browser to refuse cookies, but disabling essential cookies will prevent login.' },
      { heading: '11. Changes to This Policy', content: 'When we make material changes we will:\n\u2022 Update the "Last Updated" date\n\u2022 Display a prominent notice on the Platform\n\u2022 Send registered users an email notification\n\nContinued use of the Platform after changes take effect constitutes acceptance of the updated Policy.' },
      { heading: '12. Contact', content: 'Privacy Officer\nNexaConnect Pty Ltd\nLevel 2, 45 Hunter Street, Newcastle NSW 2300\n\nEmail: privacy@nexaconnect.com.au\nPhone: 1800 639 226 (Monday\u2013Friday, 9am\u20135pm AEST)\n\nOffice of the Australian Information Commissioner (OAIC)\noaic.gov.au | 1300 363 992' },
    ],
  },
  terms: {
    title: 'Terms of Service',
    sections: [
      { heading: 'Introduction and Acceptance', content: 'These Terms of Service ("Terms") are a legally binding agreement between you ("User") and NexaConnect Pty Ltd (ABN pending) ("NexaConnect"), governing your access to and use of nexaconnect.com.au ("Platform").\n\nBy creating an account or using the Platform, you agree to these Terms and our Privacy Policy. If you do not agree, you must not use the Platform.\n\nLast updated: February 2026.' },
      { heading: '1. NexaConnect is a Marketplace \u2014 Not a Service Provider', content: 'IMPORTANT \u2014 PLEASE READ CAREFULLY\n\nNexaConnect is a technology platform and online marketplace that connects NDIS participants seeking disability supports with independent service providers.\n\nNexaConnect is NOT an NDIS registered provider. NexaConnect does NOT provide disability services. NexaConnect is NOT a party to any service agreement between a participant and a provider.\n\nAll providers listed on the Platform are independent businesses or individuals. Their presence on the Platform does not constitute an endorsement or guarantee by NexaConnect of their services, qualifications, suitability, or compliance with applicable laws.\n\nWhen a participant engages a provider through the Platform, that engagement is solely between the participant and the provider.' },
      { heading: '2. No Guarantee of Service Quality', content: 'NexaConnect does not guarantee, warrant, or represent:\n\n\u2022 The accuracy, completeness, or currency of any provider profile information\n\u2022 The quality, safety, suitability, or legality of any services offered by providers\n\u2022 That any provider is currently NDIS registered, holds valid insurance, has passed a Worker Screening Check, or holds the qualifications they claim\n\u2022 That a provider will fulfil any booking or commitment made through the Platform\n\u2022 That any particular outcome will result from engaging a provider on the Platform\n\nParticipants must independently verify a provider\'s credentials, NDIS registration status, worker screening compliance, and suitability before entering any service agreement.' },
      { heading: '3. Provider Obligations and NDIS Code of Conduct', content: 'All providers listing on the Platform agree to:\n\nNDIS Code of Conduct Compliance\nProviders must comply with the NDIS Code of Conduct under section 123A of the National Disability Insurance Scheme Act 2013 (Cth), requiring them and their workers to:\n\u2022 Act with respect for individual rights to freedom of expression, self-determination, and decision-making\n\u2022 Respect the privacy of people with disability\n\u2022 Provide supports in a safe and competent manner with care and skill\n\u2022 Act with integrity, honesty, and transparency\n\u2022 Promptly raise and act on concerns about support quality and safety\n\u2022 Take all reasonable steps to prevent and respond to violence, exploitation, neglect, and abuse\n\u2022 Take all reasonable steps to prevent and respond to sexual misconduct\n\nWorker Screening\nProviders must ensure workers in risk-assessed roles hold a current NDIS Worker Screening Clearance under the applicable state/territory NDIS (Worker Screening) Act before providing supports.\n\nInsurance\nProviders must maintain adequate professional indemnity and public liability insurance at all times.\n\nProfile Accuracy\nProviders warrant all profile information \u2014 qualifications, registration, services, pricing, and availability \u2014 is accurate, complete, and current.\n\nBreaches may result in suspension or removal from the Platform and referral to the NDIS Quality and Safeguards Commission.' },
      { heading: '4. User Account Responsibilities', content: 'Eligibility\nYou must be at least 18 years of age, or a parent/guardian acting for an NDIS participant who is a minor.\n\nAccurate Information\nYou must provide accurate, current, and complete information during registration. Providing false information \u2014 including fraudulent credentials or impersonating another person \u2014 is a material breach of these Terms and may be a criminal offence.\n\nAccount Security\nYou are responsible for the confidentiality of your login credentials. Notify us immediately of any unauthorised access at security@nexaconnect.com.au.\n\nProhibited Conduct\nYou must not:\n\u2022 Use the Platform for any unlawful purpose\n\u2022 Post false, misleading, or defamatory content\n\u2022 Harass, abuse, or threaten other users\n\u2022 Circumvent Platform security or access data not intended for you\n\u2022 Solicit business outside the Platform to avoid subscription fees' },
      { heading: '5. Participant Responsibilities', content: 'Independent Verification\nParticipants acknowledge NexaConnect does not vet, endorse, or vouch for any provider. Before engaging a provider, participants should:\n\u2022 Verify NDIS registration at ndiscommission.gov.au\n\u2022 Confirm Worker Screening Clearance for workers providing supports\n\u2022 Independently review the provider\'s qualifications and references\n\u2022 Enter into a written service agreement with the provider\n\nNDIS Plan Compliance\nParticipants are responsible for ensuring supports arranged through the Platform are consistent with their NDIS plan. NexaConnect provides no financial or plan management advice.\n\nReporting Concerns\nIf you suspect abuse, neglect, or exploitation by a provider, contact the NDIS Quality and Safeguards Commission immediately on 1800 035 544.' },
      { heading: '6. Dispute Resolution', content: 'Participant-Provider Disputes\nNexaConnect is not party to service agreements. Disputes arising from service delivery are the responsibility of the parties involved. NexaConnect may at its discretion assist with informal mediation but has no obligation to do so.\n\nFor serious disputes \u2014 including alleged abuse, exploitation, or criminal conduct \u2014 contact the NDIS Quality and Safeguards Commission (1800 035 544) and/or police.\n\nDisputes About the Platform\n1. Submit a written complaint to support@nexaconnect.com.au\n2. We will acknowledge within 5 business days and work to resolve within 30 days\n3. Unresolved disputes may be referred to mediation via the Australian Disputes Centre (adc.org.au)\n4. If mediation fails, disputes are subject to the exclusive jurisdiction of the courts of New South Wales\n\nNothing prevents either party from seeking urgent injunctive relief.' },
      { heading: '7. Subscriptions, Payments, and Australian Consumer Law', content: 'Provider Subscription Plans\nProviders may access enhanced features through paid subscription plans as described on the Pricing page. Fees are billed monthly or annually in advance.\n\nPayment Processing\nAll payments are processed by Stripe, Inc. under Stripe\'s Terms of Service (stripe.com/legal). NexaConnect does not store credit card numbers.\n\nCancellation\nYou may cancel at any time from your account settings. Cancellation takes effect at end of the current billing period. No partial refunds are issued except as required by law.\n\nAustralian Consumer Law\nNothing in these Terms excludes, restricts, or modifies any right, remedy, guarantee, warranty, or term implied or imposed by the Australian Consumer Law (Competition and Consumer Act 2010, Schedule 2) where it would be unlawful to do so. Where the ACL applies, our liability for a failure to comply with a consumer guarantee is limited to re-supplying the service or paying the cost of resupply.' },
      { heading: '8. Intellectual Property', content: 'NexaConnect Platform\nAll intellectual property in the Platform \u2014 including software, design, trademarks, and NexaConnect-created content \u2014 is owned by or licensed to NexaConnect Pty Ltd. You may not copy, reproduce, modify, or create derivative works without our express written consent.\n\nUser Content\nBy submitting content (reviews, profile information, messages), you grant NexaConnect a non-exclusive, royalty-free, worldwide licence to use, display, and distribute that content to operate the Platform. You retain ownership and warrant your content does not infringe third-party intellectual property rights.\n\nFeedback\nFeedback you submit grants NexaConnect an irrevocable, royalty-free licence to use it without restriction or compensation.' },
      { heading: '9. Limitation of Liability', content: 'To the maximum extent permitted by applicable law (including the Australian Consumer Law):\n\n\u2022 NexaConnect\'s total aggregate liability for all claims is limited to the greater of: (a) total fees paid to NexaConnect in the 12 months before the event; or (b) AUD $100.\n\n\u2022 NexaConnect is not liable for indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, goodwill, or business interruption.\n\n\u2022 NexaConnect is not liable for any harm, injury, loss, or damage arising from the actions or omissions of any provider or participant connected through the Platform.\n\nNothing in this clause limits liability for fraud, wilful misconduct, or liability that cannot be excluded by law.' },
      { heading: '10. Account Suspension and Termination', content: 'Termination by You\nClose your account at any time from account settings or by contacting support@nexaconnect.com.au. Your profile will be removed from the directory; data may be retained per our Privacy Policy.\n\nSuspension or Termination by NexaConnect\nWe may suspend or terminate your account without prior notice if:\n\u2022 You breach these Terms\n\u2022 Your profile contains materially false or misleading information\n\u2022 You are subject to a complaint, investigation, or prohibition order from the NDIS Commission or other regulator\n\u2022 We reasonably believe continued access risks participant safety or wellbeing\n\u2022 You fail to pay subscription fees when due\n\nUpon termination, your access ceases immediately. Clauses that by nature survive termination continue to apply.' },
      { heading: '11. Governing Law and Jurisdiction', content: 'These Terms are governed by the laws of New South Wales, Australia, and applicable federal laws including the Australian Consumer Law and the Privacy Act 1988 (Cth).\n\nThe parties submit to the exclusive jurisdiction of the courts of New South Wales, without limiting the right of either party to seek urgent injunctive relief in any court of competent jurisdiction.' },
      { heading: '12. Changes to These Terms', content: 'For material changes, we will:\n\u2022 Update the "Last Updated" date\n\u2022 Display a prominent notice on the Platform\n\u2022 Send registered users an email notification with at least 14 days\' notice before the change takes effect\n\nIf you do not accept the updated Terms, stop using the Platform before the effective date. Continued use constitutes acceptance.' },
      { heading: '13. Contact', content: 'For questions, complaints, or legal notices relating to these Terms:\n\nNexaConnect Pty Ltd\nLevel 2, 45 Hunter Street, Newcastle NSW 2300\n\nEmail: legal@nexaconnect.com.au\nPhone: 1800 639 226 (Monday\u2013Friday, 9am\u20135pm AEST)' },
    ],
  },
};

function InfoPage({ pageKey }) {
  const { theme } = useTheme();
  const { dispatch } = useApp();
  const responsive = useResponsive();
  const c = COLORS[theme];
  const page = INFO_PAGES[pageKey];

  return React.createElement(Fragment, null,
    React.createElement('div', {
      style: { padding: responsive.isMobile ? '96px 20px 60px' : '96px 40px 80px', maxWidth: '800px', margin: '0 auto' },
    },
      React.createElement('button', {
        onClick: () => dispatch({type:ACTION_TYPES.NAV_BACK}),
        style: { display:'flex',alignItems:'center',gap:'6px',background:'none',border:'none',cursor:'pointer',color:c.textSecondary,fontFamily:FONTS.sans,fontSize:FONT_SIZES.sm,fontWeight:600,marginBottom:'24px' },
      }, Icons.arrowLeft(16), 'Back'),
      React.createElement('h1', {
        style: { fontSize: responsive.isMobile ? FONT_SIZES['2xl'] : FONT_SIZES['3xl'], fontWeight: 800, color: c.text, marginBottom: '32px' },
      }, page.title),
      ...page.sections.map((section, i) => React.createElement('div', { key: i, style: { marginBottom: '28px' } },
        React.createElement('h2', {
          style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text, marginBottom: '10px' },
        }, section.heading),
        React.createElement('p', {
          style: { color: c.textSecondary, fontSize: FONT_SIZES.base, lineHeight: 1.7, whiteSpace: 'pre-line' },
        }, section.content),
      )),
    ),
    React.createElement(Footer),
  );
}



function NDISCodeOfConductPage() {
  const { theme } = useTheme();
  const { dispatch } = useApp();
  const responsive = useResponsive();
  const c = COLORS[theme];
  const elements = [
    { number: '1', title: 'Rights to freedom of expression, self-determination, and decision-making', description: 'Act with respect for individual rights to freedom of expression, self-determination, and decision-making in accordance with applicable laws and conventions.', examples: 'Providers must support participants to make their own choices about their life and how supports are delivered. Respect decisions you may not agree with, provide information in accessible formats, and never coerce or pressure participants.' },
    { number: '2', title: 'Respect the privacy of people with disability', description: 'Respect and uphold the privacy rights of people with disability.', examples: 'Only collect information necessary to deliver supports. Keep personal and disability information confidential. Do not share participant information without consent, except where required by law or to prevent serious harm.' },
    { number: '3', title: 'Provide supports and services in a safe and competent manner', description: 'Provide supports and services in a safe and competent manner with care and skill.', examples: 'Maintain the skills, qualifications, and knowledge required. Follow safe work practices. Do not perform tasks outside your competence without supervision or referral. Keep qualifications and training current.' },
    { number: '4', title: 'Act with integrity, honesty, and transparency', description: 'Act with integrity, honesty, and transparency.', examples: 'Be honest about qualifications, experience, and the supports you provide. Disclose conflicts of interest. Charge only for supports actually delivered. Issue itemised invoices and maintain accurate records.' },
    { number: '5', title: 'Promptly raise and act on concerns about quality and safety', description: 'Promptly take steps to raise and act on concerns about matters that might affect the quality and safety of supports.', examples: 'If you observe a risk to a participant\u2019s safety \u2014 including from another worker \u2014 raise it promptly. Report unsafe practices, escalate to supervisors, and contact the NDIS Commission where necessary.' },
    { number: '6', title: 'Prevent and respond to violence, exploitation, neglect, and abuse', description: 'Take all reasonable steps to prevent and respond to all forms of violence, exploitation, neglect, and abuse of people with disability.', examples: 'Maintain zero tolerance for physical, emotional, sexual, or financial abuse or neglect. Report any suspected or actual abuse immediately. Participate in required abuse prevention training.' },
    { number: '7', title: 'Prevent and respond to sexual misconduct', description: 'Take all reasonable steps to prevent and respond to sexual misconduct.', examples: 'Maintain professional boundaries at all times. Never engage in sexual conduct with a participant in your care. Report any sexual misconduct by others immediately to the NDIS Commission and police.' },
  ];
  return React.createElement(Fragment, null,
    React.createElement('div', { style: { padding: responsive.isMobile ? '96px 20px 60px' : '96px 40px 80px', maxWidth: '900px', margin: '0 auto' } },
      React.createElement('button', { onClick: () => dispatch({ type: ACTION_TYPES.NAV_BACK }), style: { display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: c.textSecondary, fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, fontWeight: 600, marginBottom: '24px' } }, Icons.arrowLeft(16), 'Back'),
      React.createElement('h1', { style: { fontSize: responsive.isMobile ? FONT_SIZES['2xl'] : FONT_SIZES['3xl'], fontWeight: 800, color: c.text, marginBottom: '12px' } }, 'NDIS Code of Conduct'),
      React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.md, lineHeight: 1.7, marginBottom: SPACING.xl } }, 'The NDIS Code of Conduct is established under section 123A of the National Disability Insurance Scheme Act 2013 (Cth). It sets expectations for all NDIS providers and workers. All providers listed on NexaConnect are required to comply with the Code.'),
      React.createElement('div', { style: { background: COLORS.info + '15', border: '1px solid ' + COLORS.info + '40', borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl, display: 'flex', gap: '12px', alignItems: 'flex-start' } },
        React.createElement('span', { style: { color: COLORS.info, flexShrink: 0, marginTop: '2px' } }, Icons.shield(20, COLORS.info)),
        React.createElement('div', null,
          React.createElement('p', { style: { color: c.text, fontWeight: 700, fontSize: FONT_SIZES.base, marginBottom: '4px' } }, 'Applies to all NDIS workers \u2014 registered and unregistered'),
          React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 1.6 } }, 'The Code applies to all providers and workers delivering NDIS supports, regardless of registration status. Self-managed participants can engage unregistered providers, but those providers and their workers are still bound by the Code.'),
        ),
      ),
      React.createElement('h2', { style: { fontSize: FONT_SIZES.xl, fontWeight: 800, color: c.text, marginBottom: SPACING.lg } }, 'The 7 Elements of the Code'),
      ...elements.map((el, i) => React.createElement('div', { key: i, style: { ...cardStyle(theme), padding: SPACING.lg, marginBottom: SPACING.md } },
        React.createElement('div', { style: { display: 'flex', gap: '16px', alignItems: 'flex-start' } },
          React.createElement('div', { style: { width: 40, height: 40, borderRadius: RADIUS.full, background: COLORS.gradientPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontWeight: 800, fontSize: FONT_SIZES.base, fontFamily: FONTS.sans } }, el.number),
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('h3', { style: { fontSize: FONT_SIZES.md, fontWeight: 700, color: c.text, marginBottom: '8px', lineHeight: 1.4 } }, el.title),
            React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 1.7, marginBottom: '10px', fontStyle: 'italic' } }, '"', el.description, '"'),
            React.createElement('div', { style: { background: c.surfaceAlt, borderRadius: RADIUS.md, padding: '12px 14px' } },
              React.createElement('p', { style: { color: c.textMuted, fontSize: FONT_SIZES.xs, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' } }, 'In practice'),
              React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 1.6 } }, el.examples),
            ),
          ),
        ),
      )),
      React.createElement(Divider, { style: { margin: '32px 0' } }),
      React.createElement('h2', { style: { fontSize: FONT_SIZES.xl, fontWeight: 800, color: c.text, marginBottom: SPACING.md } }, 'How the Code Applies to Providers on NexaConnect'),
      React.createElement('div', { style: { ...cardStyle(theme), padding: SPACING.lg, marginBottom: SPACING.lg } },
        React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.base, lineHeight: 1.7, marginBottom: '16px' } }, 'By listing on NexaConnect, all providers agree to comply with the NDIS Code of Conduct as a condition of Platform use, as reflected in our Terms of Service.'),
        React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.base, lineHeight: 1.7, marginBottom: '16px' } }, 'NexaConnect monitors for reported breaches and takes action including warnings, suspension, or removal of provider listings.'),
        React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.base, lineHeight: 1.7 } }, 'NexaConnect is a marketplace and cannot guarantee ongoing Code compliance by all listed providers. Participants should check the NDIS Commission\u2019s Provider Register for a provider\u2019s registration and compliance history.'),
      ),
      React.createElement('h2', { style: { fontSize: FONT_SIZES.xl, fontWeight: 800, color: c.text, marginBottom: SPACING.md } }, 'How to Report a Code Breach'),
      React.createElement('div', { style: { background: COLORS.error + '10', border: '1px solid ' + COLORS.error + '30', borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg } },
        React.createElement('p', { style: { color: c.text, fontWeight: 700, fontSize: FONT_SIZES.base, marginBottom: '12px' } }, 'If you believe a provider or worker has breached the NDIS Code of Conduct:'),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
          ...[
            { step: '1', text: 'If you are in immediate danger, call 000.' },
            { step: '2', text: 'Contact the NDIS Quality and Safeguards Commission on 1800 035 544 (free call, Monday\u2013Friday, 9am\u20135pm local time).' },
            { step: '3', text: 'Submit a complaint online at ndiscommission.gov.au/about/complaints.' },
            { step: '4', text: 'Report the provider on NexaConnect via the Report function on their profile, or email support@nexaconnect.com.au.' },
          ].map((item, i) => React.createElement('div', { key: i, style: { display: 'flex', gap: '12px', alignItems: 'flex-start' } },
            React.createElement('div', { style: { width: 24, height: 24, borderRadius: RADIUS.full, background: COLORS.error, color: '#fff', fontWeight: 700, fontSize: FONT_SIZES.xs, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } }, item.step),
            React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 1.6 } }, item.text),
          )),
        ),
      ),
      React.createElement('div', { style: { ...glassStyle(theme), padding: SPACING.lg } },
        React.createElement('p', { style: { color: c.text, fontWeight: 700, marginBottom: '8px' } }, 'NDIS Quality and Safeguards Commission'),
        React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 1.6, marginBottom: '8px' } }, 'The national body responsible for regulating NDIS providers, handling complaints, and improving quality and safety of NDIS supports.'),
        React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm, whiteSpace: 'pre-line' } }, 'Website: ndiscommission.gov.au\nPhone: 1800 035 544\nEmail: contactcentre@ndiscommission.gov.au'),
      ),
    ),
    React.createElement(Footer),
  );
}

function ComplaintsPage() {
  const { theme } = useTheme();
  const { dispatch } = useApp();
  const responsive = useResponsive();
  const c = COLORS[theme];
  const steps = [
    { step: 'Step 1', title: 'Contact the Provider Directly', description: 'Raise your concern directly with the provider via the NexaConnect enquiry system or the contact details on their profile. Most issues can be resolved through direct communication.', timeframe: 'As soon as possible', color: COLORS.info },
    { step: 'Step 2', title: 'Submit a Complaint to NexaConnect', description: 'If unresolved, or if you are uncomfortable contacting the provider, submit a formal complaint to NexaConnect. We investigate and may contact the provider, request evidence, issue warnings, suspend a listing, or remove the provider from the Platform.', timeframe: 'Acknowledged within 2 business days; resolution target 10 business days', color: COLORS.warning },
    { step: 'Step 3', title: 'Escalate to the NDIS Commission', description: 'You can contact the NDIS Quality and Safeguards Commission at any time \u2014 you do not need to have complained to NexaConnect first. The Commission handles complaints about NDIS provider and worker conduct including Code of Conduct breaches.', timeframe: 'No time limit \u2014 contact as soon as practicable', color: COLORS.error },
  ];
  const contactMethods = [
    { icon: Icons.mail, label: 'Email', detail: 'complaints@nexaconnect.com.au', sub: 'Include your name, provider name, and description of the issue' },
    { icon: Icons.phone, label: 'Phone', detail: '1800 639 226', sub: 'Monday\u2013Friday, 9am\u20135pm AEST' },
    { icon: Icons.mapPin, label: 'Post', detail: 'Complaints Officer, NexaConnect Pty Ltd', sub: 'Level 2, 45 Hunter Street, Newcastle NSW 2300' },
  ];
  return React.createElement(Fragment, null,
    React.createElement('div', { style: { padding: responsive.isMobile ? '96px 20px 60px' : '96px 40px 80px', maxWidth: '900px', margin: '0 auto' } },
      React.createElement('button', { onClick: () => dispatch({ type: ACTION_TYPES.NAV_BACK }), style: { display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: c.textSecondary, fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm, fontWeight: 600, marginBottom: '24px' } }, Icons.arrowLeft(16), 'Back'),
      React.createElement('h1', { style: { fontSize: responsive.isMobile ? FONT_SIZES['2xl'] : FONT_SIZES['3xl'], fontWeight: 800, color: c.text, marginBottom: '12px' } }, 'Complaints and Feedback'),
      React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.md, lineHeight: 1.7, marginBottom: SPACING.xl } }, 'NexaConnect takes all complaints seriously. Your feedback helps us maintain a safe, high-quality marketplace for NDIS participants and providers.'),
      React.createElement('div', { style: { background: COLORS.error + '15', border: '1.5px solid ' + COLORS.error + '50', borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl, display: 'flex', gap: '12px', alignItems: 'flex-start' } },
        React.createElement('span', { style: { color: COLORS.error, flexShrink: 0 } }, Icons.alertCircle(22, COLORS.error)),
        React.createElement('div', null,
          React.createElement('p', { style: { color: COLORS.error, fontWeight: 700, fontSize: FONT_SIZES.base, marginBottom: '4px' } }, 'If you or someone else is in immediate danger'),
          React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 1.6 } }, 'Call 000 immediately. For urgent safeguarding concerns about an NDIS participant, also call the NDIS Quality and Safeguards Commission on 1800 035 544.'),
        ),
      ),
      React.createElement('h2', { style: { fontSize: FONT_SIZES.xl, fontWeight: 800, color: c.text, marginBottom: SPACING.lg } }, 'Complaints Process'),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: SPACING.md, marginBottom: SPACING.xl } },
        ...steps.map((s, i) => React.createElement('div', { key: i, style: { ...cardStyle(theme), padding: SPACING.lg, borderLeft: '4px solid ' + s.color } },
          React.createElement('div', { style: { display: 'flex', gap: '12px', alignItems: 'flex-start' } },
            React.createElement('div', { style: { background: s.color + '20', color: s.color, borderRadius: RADIUS.md, padding: '4px 10px', fontSize: FONT_SIZES.xs, fontWeight: 700, fontFamily: FONTS.sans, flexShrink: 0, whiteSpace: 'nowrap' } }, s.step),
            React.createElement('div', { style: { flex: 1 } },
              React.createElement('h3', { style: { color: c.text, fontWeight: 700, fontSize: FONT_SIZES.md, marginBottom: '8px' } }, s.title),
              React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 1.7, marginBottom: '10px' } }, s.description),
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
                React.createElement('span', { style: { color: c.textMuted } }, Icons.clock(14, c.textMuted)),
                React.createElement('p', { style: { color: c.textMuted, fontSize: FONT_SIZES.xs, fontWeight: 600 } }, s.timeframe),
              ),
            ),
          ),
        )),
      ),
      React.createElement('h2', { style: { fontSize: FONT_SIZES.xl, fontWeight: 800, color: c.text, marginBottom: SPACING.md } }, 'What Can You Complain About?'),
      React.createElement('div', { style: { ...cardStyle(theme), padding: SPACING.lg, marginBottom: SPACING.xl } },
        React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm, marginBottom: '12px' } }, 'You can make a complaint to NexaConnect about:'),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : '1fr 1fr', gap: '8px' } },
          ...[
            'A provider\u2019s conduct or behaviour',
            'Inaccurate or misleading provider profile information',
            'Poor quality of service or failure to deliver agreed supports',
            'Financial misconduct or overcharging',
            'Privacy breaches or misuse of personal information',
            'Discrimination or disrespectful treatment',
            'Failure to respond to enquiries or bookings',
            'Any breach of the NDIS Code of Conduct',
          ].map((item, i) => React.createElement('div', { key: i, style: { display: 'flex', gap: '8px', alignItems: 'flex-start' } },
            React.createElement('span', { style: { color: COLORS.success, flexShrink: 0, marginTop: '2px' } }, Icons.checkCircle(16, COLORS.success)),
            React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 1.5 } }, item),
          )),
        ),
      ),
      React.createElement('h2', { style: { fontSize: FONT_SIZES.xl, fontWeight: 800, color: c.text, marginBottom: SPACING.md } }, 'Contact NexaConnect'),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: SPACING.md, marginBottom: SPACING.xl } },
        ...contactMethods.map((m, i) => React.createElement('div', { key: i, style: { ...cardStyle(theme), padding: SPACING.lg, textAlign: 'center' } },
          React.createElement('div', { style: { color: COLORS.primary[400], display: 'flex', justifyContent: 'center', marginBottom: '10px' } }, m.icon(24, COLORS.primary[400])),
          React.createElement('p', { style: { color: c.text, fontWeight: 700, fontSize: FONT_SIZES.sm, marginBottom: '4px' } }, m.label),
          React.createElement('p', { style: { color: COLORS.primary[400], fontSize: FONT_SIZES.sm, fontWeight: 600, marginBottom: '4px' } }, m.detail),
          React.createElement('p', { style: { color: c.textMuted, fontSize: FONT_SIZES.xs, lineHeight: 1.5 } }, m.sub),
        )),
      ),
      React.createElement(Divider, { style: { margin: '32px 0' } }),
      React.createElement('h2', { style: { fontSize: FONT_SIZES.xl, fontWeight: 800, color: c.text, marginBottom: SPACING.md } }, 'Escalation: NDIS Quality and Safeguards Commission'),
      React.createElement('div', { style: { ...glassStyle(theme), padding: SPACING.lg, marginBottom: SPACING.lg } },
        React.createElement('p', { style: { color: c.text, fontWeight: 700, fontSize: FONT_SIZES.md, marginBottom: '12px' } }, 'You have the right to contact the NDIS Commission at any time'),
        React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 1.7, marginBottom: '16px' } }, 'You do not need to have complained to NexaConnect first. The NDIS Quality and Safeguards Commission is an independent statutory authority handling complaints about NDIS provider and worker conduct.'),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
          ...[
            { label: 'Phone', value: '1800 035 544 (free call, Monday\u2013Friday, 9am\u20135pm local time)' },
            { label: 'Online', value: 'ndiscommission.gov.au/about/complaints' },
            { label: 'Email', value: 'contactcentre@ndiscommission.gov.au' },
            { label: 'Post', value: 'NDIS Quality and Safeguards Commission, PO Box 210, Penrith NSW 2750' },
            { label: 'TTY', value: '1800 555 677 (National Relay Service)' },
          ].map((item, i) => React.createElement('div', { key: i, style: { display: 'flex', gap: '12px', flexWrap: 'wrap' } },
            React.createElement('span', { style: { color: c.text, fontWeight: 700, fontSize: FONT_SIZES.sm, minWidth: '60px' } }, item.label + ':'),
            React.createElement('span', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm } }, item.value),
          )),
        ),
      ),
      React.createElement('h2', { style: { fontSize: FONT_SIZES.xl, fontWeight: 800, color: c.text, marginBottom: SPACING.md } }, 'Providing Feedback'),
      React.createElement('div', { style: { ...cardStyle(theme), padding: SPACING.lg } },
        React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.base, lineHeight: 1.7, marginBottom: '16px' } }, 'We welcome feedback about the NexaConnect platform \u2014 including what we do well and where we can improve.'),
        React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.base, lineHeight: 1.7, marginBottom: '16px' } }, 'For general feedback, contact us at support@nexaconnect.com.au or use the feedback form in your account dashboard.'),
        React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.base, lineHeight: 1.7 } }, 'Provider feedback about the platform can be sent to partners@nexaconnect.com.au.'),
      ),
    ),
    React.createElement(Footer),
  );
}

/* ═══════════════════════════════════════════════════════════════
   Phase 9: Root App Assembly
   ═══════════════════════════════════════════════════════════════ */

function AppRouter() {
  const { state } = useApp();
  const route = state.route;

  switch (route) {
    case 'landing': return React.createElement(LandingPage);
    case 'pricing': return React.createElement(PricingPage);
    case 'login': return React.createElement(LoginPage);
    case 'register': return React.createElement(RegisterPage);
    case 'directory': return React.createElement(DirectoryPage);
    case 'provider-profile': return React.createElement(ProviderProfilePage);
    case 'provider-dashboard': return React.createElement(ProviderDashboard);
    case 'participant-dashboard': return React.createElement(ParticipantDashboard);
    case 'admin-dashboard': return React.createElement(AdminDashboard);
    case 'help': return React.createElement(InfoPage, { pageKey: 'help' });
    case 'contact': return React.createElement(InfoPage, { pageKey: 'contact' });
    case 'ndis-resources': return React.createElement(InfoPage, { pageKey: 'ndis-resources' });
    case 'about': return React.createElement(InfoPage, { pageKey: 'about' });
    case 'privacy': return React.createElement(InfoPage, { pageKey: 'privacy' });
    case 'terms': return React.createElement(InfoPage, { pageKey: 'terms' });
    case 'ndis-code-of-conduct': return React.createElement(NDISCodeOfConductPage);
    case 'complaints': return React.createElement(ComplaintsPage);
    default: return React.createElement(LandingPage);
  }
}

function App() {
  const [themeState, setThemeState] = useState(() => {
    try { return localStorage.getItem('nexaconnect_theme') || 'dark'; } catch(e) { return 'dark'; }
  });
  const [state, dispatch] = useReducer(appReducer, undefined, getInitialState);

  // Inject styles on mount
  useEffect(() => { injectStyles(); }, []);

  // Load data from Supabase on mount
  useEffect(() => {
    async function loadDbData() {
      if (!isSupabaseConfigured()) {
        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
        return;
      }
      try {
        const [dbProviders, dbReviews, dbEnquiries, dbBookings] = await Promise.all([
          db.fetchProviders(),
          db.fetchReviews(),
          db.fetchEnquiries(),
          db.fetchBookings(),
        ]);
        if (dbProviders) dispatch({ type: ACTION_TYPES.SET_DB_PROVIDERS, payload: dbProviders });
        if (dbReviews) dispatch({ type: ACTION_TYPES.SET_DB_REVIEWS, payload: dbReviews });
        if (dbEnquiries) dispatch({ type: ACTION_TYPES.SET_DB_ENQUIRIES, payload: dbEnquiries });
        if (dbBookings) dispatch({ type: ACTION_TYPES.SET_DB_BOOKINGS, payload: dbBookings });
      } catch (err) {
        console.error('Failed to load data from Supabase:', err);
      }
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
    }
    loadDbData();
  }, []);

  // Handle Stripe checkout return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      const plan = params.get('plan');
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      // Reload provider data to get updated tier
      if (isSupabaseConfigured() && state.user) {
        db.fetchProviderByUserId(state.user.id).then(provider => {
          if (provider) {
            dispatch({ type: ACTION_TYPES.UPDATE_PROVIDER_PROFILE, payload: provider });
            dispatch({ type: ACTION_TYPES.SET_USER, payload: { ...state.user, tier: provider.tier } });
          }
        });
      }
    } else if (params.get('checkout') === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Supabase auth state listener
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        dispatch({ type: ACTION_TYPES.LOGOUT });
      } else if (event === 'SIGNED_IN' && session && !state.user) {
        // Restore session on page refresh
        const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          const role = profile.role || 'participant';
          const user = { id: session.user.id, name: profile.name || session.user.email, email: session.user.email, role, tier: profile.tier || 'starter' };
          dispatch({ type: ACTION_TYPES.SET_USER, payload: user });
          dispatch({ type: ACTION_TYPES.NAV_GOTO, payload: { route: role === 'admin' ? 'admin-dashboard' : role === 'provider' ? 'provider-dashboard' : 'participant-dashboard' } });

          // Load provider/participant record
          if (role === 'provider') {
            const dbProvider = await db.fetchProviderByUserId(session.user.id);
            if (dbProvider) dispatch({ type: ACTION_TYPES.UPDATE_PROVIDER_PROFILE, payload: dbProvider });
          } else if (role === 'participant') {
            const dbParticipant = await db.fetchParticipant(session.user.id);
            if (dbParticipant) dispatch({ type: ACTION_TYPES.UPDATE_PARTICIPANT_PROFILE, payload: dbParticipant });
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Sync theme
  useEffect(() => {
    if (state.theme !== themeState) setThemeState(state.theme);
  }, [state.theme]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nexaconnect_theme', state.theme);
      localStorage.setItem('nexaconnect_state', JSON.stringify({ theme: state.theme, user: state.user }));
    } catch(e) {}
  }, [state.theme, state.user]);

  // Scroll to top on route change
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [state.route]);

  const toggleTheme = useCallback(() => {
    const next = themeState === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    dispatch({ type: ACTION_TYPES.SET_THEME, payload: next });
  }, [themeState]);

  return React.createElement(ThemeContext.Provider, { value: { theme: themeState, toggle: toggleTheme } },
    React.createElement(AppContext.Provider, { value: { state: { ...state, theme: themeState }, dispatch } },
      React.createElement(ToastProvider, null,
        React.createElement(ErrorBoundary, null,
          React.createElement(PageShell, null,
            React.createElement(AppRouter),
          ),
        ),
      ),
    ),
  );
}

export default App;
