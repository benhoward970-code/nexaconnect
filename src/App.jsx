/* ═══════════════════════════════════════════════════════════════
   NexaConnect — NDIS Provider-Participant Marketplace
   Vite + React Application
   ═══════════════════════════════════════════════════════════════ */

import React, { useState, useEffect, useReducer, useCallback, useMemo, useRef, createContext, useContext, Fragment } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
        XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase, isSupabaseConfigured } from './supabase';

/* ─── Phase 1: Foundation ─────────────────────────────────────── */

// ── Color Palette ──
const COLORS = {
  dark: {
    bg: '#0A0A0F',
    surface: '#141420',
    surfaceHover: '#1C1C2E',
    surfaceAlt: '#1A1A2E',
    border: 'rgba(139,92,246,0.15)',
    borderHover: 'rgba(139,92,246,0.3)',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    glass: 'rgba(20,20,32,0.8)',
    glassBorder: 'rgba(139,92,246,0.12)',
    overlay: 'rgba(0,0,0,0.6)',
    cardShadow: '0 8px 32px rgba(0,0,0,0.4)',
    navBg: 'rgba(10,10,15,0.85)',
  },
  light: {
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceHover: '#F1F5F9',
    surfaceAlt: '#F8FAFC',
    border: 'rgba(139,92,246,0.12)',
    borderHover: 'rgba(139,92,246,0.25)',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    glass: 'rgba(255,255,255,0.8)',
    glassBorder: 'rgba(139,92,246,0.1)',
    overlay: 'rgba(0,0,0,0.4)',
    cardShadow: '0 4px 24px rgba(0,0,0,0.08)',
    navBg: 'rgba(255,255,255,0.85)',
  },
  primary: {
    50: '#F5F3FF', 100: '#EDE9FE', 200: '#DDD6FE', 300: '#C4B5FD',
    400: '#A78BFA', 500: '#8B5CF6', 600: '#7C3AED', 700: '#6D28D9',
    800: '#5B21B6', 900: '#4C1D95',
  },
  accent: {
    50: '#F0FDFA', 100: '#CCFBF1', 200: '#99F6E4', 300: '#5EEAD4',
    400: '#2DD4BF', 500: '#14B8A6', 600: '#0D9488', 700: '#0F766E',
    800: '#115E59', 900: '#134E4A',
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  star: '#FBBF24',
  gradientPrimary: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
  gradientAccent: 'linear-gradient(135deg, #14B8A6, #0D9488)',
  gradientHero: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 40%, #14B8A6 100%)',
  gradientText: 'linear-gradient(135deg, #8B5CF6, #14B8A6)',
  gradientCard: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(20,184,166,0.1))',
};

// ── Typography ──
const FONTS = {
  sans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
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
      0%, 100% { border-color: rgba(139,92,246,0.3); box-shadow: 0 0 15px rgba(139,92,246,0.1); }
      50% { border-color: rgba(20,184,166,0.3); box-shadow: 0 0 15px rgba(20,184,166,0.1); }
    }

    .nc-animate-fade { animation: nc-fadeIn 0.5s ease forwards; }
    .nc-animate-fade-up { animation: nc-fadeInUp 0.6s ease forwards; }
    .nc-animate-scale { animation: nc-scaleIn 0.4s ease forwards; }
    .nc-animate-float { animation: nc-float 3s ease-in-out infinite; }

    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.5); }

    ::selection { background: rgba(139,92,246,0.3); color: inherit; }

    input, textarea, select { font-family: ${FONTS.sans}; }
    * { scrollbar-width: thin; scrollbar-color: rgba(139,92,246,0.3) transparent; }

    .nc-glass-hover:hover { border-color: rgba(139,92,246,0.3) !important; box-shadow: 0 8px 32px rgba(139,92,246,0.15) !important; }
    .nc-card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(139,92,246,0.2) !important; }
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
    primary: { background: COLORS.gradientPrimary, color: '#fff', boxShadow: '0 4px 15px rgba(139,92,246,0.3)' },
    secondary: { background: c.surface, color: c.text, border: `1px solid ${c.border}` },
    ghost: { background: 'transparent', color: c.textSecondary },
    accent: { background: COLORS.gradientAccent, color: '#fff', boxShadow: '0 4px 15px rgba(20,184,166,0.3)' },
    danger: { background: COLORS.error, color: '#fff' },
    outline: { background: 'transparent', color: COLORS.primary[500], border: `2px solid ${COLORS.primary[500]}` },
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
    free: { background: `${c.textMuted}20`, color: c.textMuted },
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
  { id:'p2',name:'PhysioPlus Disability',email:'physio@provider.com.au',password:'password',tier:'pro',verified:true,
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
  { id:'p3',name:'CareFirst Plan Management',email:'carefirst@provider.com.au',password:'password',tier:'pro',verified:true,
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
  { id:'p6',name:'ConnectAbility Support Coordination',email:'connectability@provider.com.au',password:'password',tier:'pro',verified:false,
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
  { id:'p7',name:'DriveAbility Transport',email:'driveability@provider.com.au',password:'password',tier:'pro',verified:true,
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
  { id:'p8',name:'WorkBridge Employment',email:'workbridge@provider.com.au',password:'password',tier:'pro',verified:false,
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
  { id:'p9',name:'NurtureCare Nursing',email:'nurturecare@provider.com.au',password:'password',tier:'pro',verified:true,
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
  { id:'p11',name:'MealMate Kitchen',email:'mealmate@provider.com.au',password:'password',tier:'free',verified:false,
    categories:['meal-prep','daily-living'],suburb:'Wyong',state:'NSW',postcode:'2259',phone:'02 4353 2222',website:'',
    description:'Meal planning, grocery shopping, and cooking skills support based on dietary needs.',
    shortDescription:'Meal prep and cooking support.',photos:[],
    rating:4.2,reviewCount:8,responseRate:80,responseTime:'1-2 days',waitTime:'1 week',
    planTypes:['Plan Managed','Self Managed'],
    availability:{mon:'9am-3pm',tue:'9am-3pm',wed:'9am-3pm',thu:'9am-3pm',fri:'9am-1pm',sat:'Closed',sun:'Closed'},
    serviceAreas:['Wyong','Tuggerah','The Entrance'],founded:2021,teamSize:'5',languages:['English'],
    features:['Dietary plans','Cooking skills'],viewsThisMonth:45,enquiriesThisMonth:3,bookingsThisMonth:2 },
  { id:'p12',name:'Happy Days Community',email:'happydays@provider.com.au',password:'password',tier:'free',verified:false,
    categories:['community','respite'],suburb:'Tuggerah',state:'NSW',postcode:'2259',phone:'02 4353 3333',website:'',
    description:'Fun community group activities and weekend respite for adults with disability.',
    shortDescription:'Fun community activities and weekend respite.',photos:[],
    rating:4.0,reviewCount:12,responseRate:75,responseTime:'2-3 days',waitTime:'1-2 weeks',
    planTypes:['Agency','Plan Managed'],
    availability:{mon:'10am-4pm',tue:'Closed',wed:'10am-4pm',thu:'Closed',fri:'10am-4pm',sat:'9am-4pm',sun:'Closed'},
    serviceAreas:['Tuggerah','Wyong','Gosford'],founded:2022,teamSize:'4',languages:['English'],
    features:['Group activities','Weekend programs'],viewsThisMonth:34,enquiriesThisMonth:2,bookingsThisMonth:1 },
  { id:'p13',name:'SafeHands Daily',email:'safehands@provider.com.au',password:'password',tier:'free',verified:false,
    categories:['daily-living'],suburb:'The Entrance',state:'NSW',postcode:'2261',phone:'02 4332 4444',website:'',
    description:'Personal care and daily living support on the Central Coast.',
    shortDescription:'Personal care on the Central Coast.',photos:[],
    rating:4.1,reviewCount:6,responseRate:82,responseTime:'1-2 days',waitTime:'1-2 weeks',
    planTypes:['Agency','Plan Managed'],
    availability:{mon:'7am-5pm',tue:'7am-5pm',wed:'7am-5pm',thu:'7am-5pm',fri:'7am-3pm',sat:'Closed',sun:'Closed'},
    serviceAreas:['The Entrance','Tuggerah','Gosford'],founded:2023,teamSize:'3',languages:['English'],
    features:['Personal care','Domestic help'],viewsThisMonth:28,enquiriesThisMonth:2,bookingsThisMonth:1 },
  { id:'p14',name:'GreenThumb Garden Therapy',email:'greenthumb@provider.com.au',password:'password',tier:'free',verified:false,
    categories:['community','therapy'],suburb:'Muswellbrook',state:'NSW',postcode:'2333',phone:'02 6543 5555',website:'',
    description:'Therapeutic gardening and horticulture programs.',
    shortDescription:'Therapeutic gardening programs.',photos:[],
    rating:4.5,reviewCount:10,responseRate:70,responseTime:'2-3 days',waitTime:'2 weeks',
    planTypes:['Plan Managed','Self Managed'],
    availability:{mon:'9am-2pm',tue:'9am-2pm',wed:'Closed',thu:'9am-2pm',fri:'9am-2pm',sat:'Closed',sun:'Closed'},
    serviceAreas:['Muswellbrook','Singleton','Cessnock'],founded:2022,teamSize:'3',languages:['English','Korean'],
    features:['Garden therapy','Group programs'],viewsThisMonth:42,enquiriesThisMonth:3,bookingsThisMonth:2 },
  { id:'p15',name:'TechAssist AT Solutions',email:'techassist@provider.com.au',password:'password',tier:'pro',verified:true,
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
  { id:'p17',name:'SpeakEasy Speech Pathology',email:'speakeasy@provider.com.au',password:'password',tier:'pro',verified:true,
    categories:['therapy','early-intervention'],suburb:'Kurri Kurri',state:'NSW',postcode:'2327',phone:'02 4937 8888',website:'www.speakeasysp.com.au',
    description:'Speech pathology for communication difficulties, swallowing disorders, and language delays.',
    shortDescription:'Speech pathology for communication and language.',
    photos:['Therapy session','AAC devices'],
    rating:4.8,reviewCount:44,responseRate:96,responseTime:'< 3 hours',waitTime:'3-4 weeks',
    planTypes:['Agency','Plan Managed','Self Managed'],
    availability:{mon:'8am-6pm',tue:'8am-6pm',wed:'8am-6pm',thu:'8am-6pm',fri:'8am-4pm',sat:'9am-12pm',sun:'Closed'},
    serviceAreas:['Kurri Kurri','Cessnock','Maitland','Singleton'],founded:2019,teamSize:'8',languages:['English'],
    features:['AAC specialist','Mealtime management','Social skills','Telehealth'],viewsThisMonth:145,enquiriesThisMonth:16,bookingsThisMonth:10 },
  { id:'p18',name:'FreshStart Respite',email:'freshstart@provider.com.au',password:'password',tier:'free',verified:false,
    categories:['respite'],suburb:'Morisset',state:'NSW',postcode:'2264',phone:'02 4973 9999',website:'',
    description:'In-home and centre-based respite care so carers can recharge.',
    shortDescription:'In-home and centre-based respite.',photos:[],
    rating:4.0,reviewCount:5,responseRate:78,responseTime:'1-2 days',waitTime:'2-3 weeks',
    planTypes:['Agency','Plan Managed'],
    availability:{mon:'8am-6pm',tue:'8am-6pm',wed:'8am-6pm',thu:'8am-6pm',fri:'8am-4pm',sat:'9am-3pm',sun:'Closed'},
    serviceAreas:['Morisset','Toronto','Lake Macquarie'],founded:2023,teamSize:'6',languages:['English'],
    features:['In-home respite','Centre-based','Overnight'],viewsThisMonth:22,enquiriesThisMonth:1,bookingsThisMonth:1 },
  { id:'p19',name:'Basic Care Provider',email:'basic@provider.com.au',password:'password',tier:'free',verified:false,
    categories:['daily-living','transport'],suburb:'Swansea',state:'NSW',postcode:'2281',phone:'02 4971 0000',website:'',
    description:'Daily living support and transport in the Swansea area.',
    shortDescription:'Daily living and transport in Swansea.',photos:[],
    rating:3.8,reviewCount:4,responseRate:72,responseTime:'2-3 days',waitTime:'1-2 weeks',
    planTypes:['Plan Managed'],
    availability:{mon:'8am-4pm',tue:'8am-4pm',wed:'8am-4pm',thu:'8am-4pm',fri:'8am-2pm',sat:'Closed',sun:'Closed'},
    serviceAreas:['Swansea','Belmont','Lake Macquarie'],founded:2024,teamSize:'2',languages:['English'],
    features:['Personal care','Transport'],viewsThisMonth:15,enquiriesThisMonth:1,bookingsThisMonth:0 },
  { id:'p20',name:'Pathways OT',email:'pathways@provider.com.au',password:'password',tier:'pro',verified:true,
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
      {from:'participant',text:'My son has recently been diagnosed with autism. We are looking for a multidisciplinary early intervention program.',date:'2025-12-18',time:'10:00 AM'},
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

// ── Analytics Data ──
const ANALYTICS_MONTHS = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan'];
function generateAnalytics(provider) {
  const base = provider.tier === 'premium' ? 300 : provider.tier === 'pro' ? 150 : 50;
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
    features:['Featured placement','Full profile with photos','Unlimited enquiries','Analytics dashboard','Priority email support','Review responses','Up to 10 photos'],
    limits:{ descLength:2000, enquiriesPerMonth:Infinity, photos:10, analytics:true, directBooking:false, verified:false, promoted:false }},
  { id:'premium',name:'Premium',price:149,priceAnnual:119,popular:false,
    features:['Top search placement','Verified provider badge','Direct booking system','Lead generation tools','Promoted listings','Dedicated account manager','Unlimited photos','Full analytics suite'],
    limits:{ descLength:5000, enquiriesPerMonth:Infinity, photos:Infinity, analytics:true, directBooking:true, verified:true, promoted:true }},
];

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
    const tierWeight = { premium: 100, pro: 50, free: 0 };
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

function Navbar() {
  const { theme } = useTheme();
  const { state, dispatch } = useApp();
  const responsive = useResponsive();
  const c = COLORS[theme];
  const isMarketing = ['landing','pricing','login','register','directory','provider-profile'].includes(state.route);
  const isLoggedIn = !!state.user;

  return React.createElement('nav', {
    style: {
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 24px',
      height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
        style: { cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
      },
        React.createElement('div', { style: {
          width: 32, height: 32, borderRadius: RADIUS.md, background: COLORS.gradientPrimary,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '14px',
        } }, 'N'),
        React.createElement('span', { style: { fontWeight: 800, fontSize: FONT_SIZES.lg, color: c.text, letterSpacing: '-0.02em' } }, 'Nexa'),
        React.createElement('span', { style: { fontWeight: 800, fontSize: FONT_SIZES.lg, ...gradientText(), letterSpacing: '-0.02em' } }, 'Connect'),
      ),
    ),

    // Center: Nav links (desktop + marketing)
    !responsive.isMobile && isMarketing && React.createElement('div', { style: { display: 'flex', gap: '32px', alignItems: 'center' } },
      ['Directory','Pricing','About'].map(item => React.createElement('button', {
        key: item,
        onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route: item === 'About' ? 'landing' : item.toLowerCase()}}),
        style: { background: 'none', border: 'none', color: c.textSecondary, cursor: 'pointer',
          fontSize: FONT_SIZES.sm, fontWeight: 600, fontFamily: FONTS.sans, transition: 'color 0.2s' },
        onMouseEnter: (e) => e.target.style.color = COLORS.primary[500],
        onMouseLeave: (e) => e.target.style.color = c.textSecondary,
      }, item)),
    ),

    // Right: Actions
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
      React.createElement('button', {
        onClick: () => {
          const newTheme = theme === 'dark' ? 'light' : 'dark';
          dispatch({type:ACTION_TYPES.SET_THEME,payload:newTheme});
        },
        style: { background: 'none', border: 'none', cursor: 'pointer', color: c.textSecondary, display: 'flex', padding: '6px' },
      }, theme === 'dark' ? Icons.sun(18) : Icons.moon(18)),

      !isLoggedIn && React.createElement(Fragment, null,
        !responsive.isMobile && React.createElement(Button, {
          variant: 'ghost', size: 'sm',
          onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'login'}}),
        }, 'Log In'),
        React.createElement(Button, {
          variant: 'primary', size: 'sm',
          onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'register'}}),
        }, 'Get Started'),
      ),

      isLoggedIn && React.createElement(Fragment, null,
        React.createElement('button', {
          style: { background:'none',border:'none',cursor:'pointer',color:c.textSecondary,display:'flex',position:'relative',padding:'6px' },
        }, Icons.bell(18),
          React.createElement('span', { style: {
            position:'absolute',top:2,right:2,width:8,height:8,borderRadius:'50%',background:COLORS.error,
          } }),
        ),
        React.createElement('div', {
          onClick: () => {
            const route = state.user.role === 'admin' ? 'admin-dashboard' : state.user.role === 'provider' ? 'provider-dashboard' : 'participant-dashboard';
            dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route}});
          },
          style: { cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
        },
          React.createElement(Avatar, { name: state.user.name, size: 32 }),
          !responsive.isMobile && React.createElement('span', { style: { fontSize: FONT_SIZES.sm, fontWeight: 600, color: c.text } }, state.user.name),
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
  const isMarketing = ['landing','pricing','login','register','directory','provider-profile'].includes(state.route);
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
  ];

  const navItems = role === 'admin' ? adminNav : role === 'provider' ? providerNav : participantNav;

  const sidebarContent = React.createElement('div', {
    style: {
      width: isOpen ? '240px' : '0px', height: 'calc(100vh - 64px)', position: 'fixed',
      top: '64px', left: 0, background: c.surface, borderRight: `1px solid ${c.border}`,
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
          variant: state.providers?.find(p => p.email === state.user.email)?.tier || 'free',
          size: 'xs',
          style: { marginTop: '4px' },
        }, (state.providers?.find(p => p.email === state.user.email)?.tier || 'free').charAt(0).toUpperCase() + (state.providers?.find(p => p.email === state.user.email)?.tier || 'free').slice(1) + ' Plan'),
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
            React.createElement('div', { style: { width:28,height:28,borderRadius:RADIUS.sm,background:COLORS.gradientPrimary,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:'12px' } }, 'N'),
            React.createElement('span', { style: { fontWeight: 800, fontSize: FONT_SIZES.md, color: c.text } }, 'NexaConnect'),
          ),
          React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 1.6 } },
            'Connecting NDIS participants with quality providers across Australia.'),
        ),
        // Links columns
        ...[
          { title: 'Platform', links: [['Browse Providers','directory'],['Pricing','pricing'],['For Providers','register']] },
          { title: 'Support', links: [['Help Centre','landing'],['Contact Us','landing'],['NDIS Resources','landing']] },
          { title: 'Company', links: [['About','landing'],['Privacy Policy','landing'],['Terms of Service','landing']] },
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
  const isMarketing = ['landing','pricing','login','register','directory','provider-profile'].includes(state.route);
  const showSidebar = state.user && !isMarketing;
  const sidebarWidth = showSidebar && state.sidebarOpen && !responsive.isMobile ? 240 : 0;

  return React.createElement('div', {
    style: { minHeight: '100vh', background: c.bg, color: c.text, fontFamily: FONTS.sans, transition: 'background 0.3s' },
  },
    React.createElement(Navbar),
    showSidebar && React.createElement(Sidebar),
    React.createElement('main', {
      style: {
        marginTop: '64px', marginLeft: sidebarWidth,
        transition: 'margin-left 0.3s', minHeight: 'calc(100vh - 64px)',
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
    { icon: Icons.search, title: 'Smart Search', desc: 'Find providers by service type, location, availability, and more with our intelligent search.' },
    { icon: Icons.shield, title: 'Verified Providers', desc: 'Premium providers are verified for quality, giving you peace of mind.' },
    { icon: Icons.star, title: 'Real Reviews', desc: 'Read genuine reviews from other NDIS participants to make informed decisions.' },
    { icon: Icons.calendar, title: 'Direct Booking', desc: 'Book appointments directly with Premium providers, no phone tag needed.' },
    { icon: Icons.barChart, title: 'Provider Analytics', desc: 'Providers get powerful insights to understand and grow their business.' },
    { icon: Icons.zap, title: 'Instant Connect', desc: 'Send enquiries directly to providers and get responses within hours.' },
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
        position: 'relative', overflow: 'hidden', minHeight: responsive.isMobile ? '85vh' : '90vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: responsive.isMobile ? '80px 20px 40px' : '80px 40px',
      },
    },
      // Background gradient
      React.createElement('div', { style: {
        position: 'absolute', inset: 0,
        background: theme === 'dark'
          ? 'radial-gradient(ellipse at 30% 20%, rgba(139,92,246,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(20,184,166,0.1) 0%, transparent 50%)'
          : 'radial-gradient(ellipse at 30% 20%, rgba(139,92,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(20,184,166,0.06) 0%, transparent 50%)',
      } }),
      React.createElement('div', { style: { position: 'relative', maxWidth: '1200px', width: '100%', textAlign: 'center', zIndex: 1 } },
        React.createElement('div', { style: { animation: 'nc-fadeInUp 0.8s ease' } },
          React.createElement(Badge, { variant: 'default', style: { marginBottom: '20px' } }, 'Australia\'s NDIS Provider Marketplace'),
          React.createElement('h1', {
            style: {
              fontSize: responsive.isMobile ? FONT_SIZES['3xl'] : FONT_SIZES['6xl'],
              fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '24px',
              color: c.text,
            },
          },
            'Find Your Perfect', React.createElement('br'),
            React.createElement('span', { style: gradientText() }, 'NDIS Provider'),
          ),
          React.createElement('p', {
            style: {
              fontSize: responsive.isMobile ? FONT_SIZES.md : FONT_SIZES.xl, color: c.textSecondary,
              maxWidth: '640px', margin: '0 auto 32px', lineHeight: 1.6,
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
    React.createElement('section', { style: { padding: responsive.isMobile ? '60px 20px' : '80px 40px' } },
      React.createElement('div', { style: { maxWidth: '1200px', margin: '0 auto' } },
        React.createElement('div', { style: { textAlign: 'center', marginBottom: '48px' } },
          React.createElement(Badge, { variant: 'default', style: { marginBottom: '12px' } }, 'Features'),
          React.createElement('h2', { style: { fontSize: responsive.isMobile ? FONT_SIZES['2xl'] : FONT_SIZES['3xl'], fontWeight: 800, color: c.text, marginBottom: '12px' } },
            'Everything You Need'),
          React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.md, maxWidth: '500px', margin: '0 auto' } },
            'A comprehensive platform designed for NDIS participants and providers.'),
        ),
        React.createElement('div', {
          style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : responsive.isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '24px' },
        },
          FEATURES.map((f, i) => React.createElement(Card, {
            key: i, hover: true, glass: true,
            style: { animation: `nc-fadeInUp ${0.3 + i * 0.1}s ease forwards`, opacity: 0 },
          },
            React.createElement('div', {
              style: { width: 48, height: 48, borderRadius: RADIUS.md, background: COLORS.gradientCard,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: COLORS.primary[500] },
            }, f.icon(24, COLORS.primary[500])),
            React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text, marginBottom: '8px' } }, f.title),
            React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 1.6 } }, f.desc),
          )),
        ),
      ),
    ),

    // How It Works
    React.createElement('section', { style: { padding: responsive.isMobile ? '60px 20px' : '80px 40px', background: c.surfaceAlt } },
      React.createElement('div', { style: { maxWidth: '1000px', margin: '0 auto' } },
        React.createElement('div', { style: { textAlign: 'center', marginBottom: '48px' } },
          React.createElement(Badge, { variant: 'info', style: { marginBottom: '12px' } }, 'How It Works'),
          React.createElement('h2', { style: { fontSize: responsive.isMobile ? FONT_SIZES['2xl'] : FONT_SIZES['3xl'], fontWeight: 800, color: c.text } },
            'Get Connected in 3 Steps'),
        ),
        React.createElement('div', {
          style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '32px' },
        },
          HOW_IT_WORKS.map((step, i) => React.createElement('div', {
            key: i, style: { textAlign: 'center', animation: `nc-fadeInUp ${0.4 + i * 0.15}s ease forwards`, opacity: 0 },
          },
            React.createElement('div', {
              style: {
                width: 64, height: 64, borderRadius: '50%', background: COLORS.gradientPrimary,
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                fontSize: FONT_SIZES.xl, fontWeight: 800, color: '#fff',
              },
            }, step.step),
            React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text, marginBottom: '8px' } }, step.title),
            React.createElement('p', { style: { color: c.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 1.6 } }, step.desc),
          )),
        ),
      ),
    ),

    // Category Showcase
    React.createElement('section', { style: { padding: responsive.isMobile ? '60px 20px' : '80px 40px' } },
      React.createElement('div', { style: { maxWidth: '1200px', margin: '0 auto' } },
        React.createElement('div', { style: { textAlign: 'center', marginBottom: '40px' } },
          React.createElement('h2', { style: { fontSize: responsive.isMobile ? FONT_SIZES['2xl'] : FONT_SIZES['3xl'], fontWeight: 800, color: c.text, marginBottom: '12px' } },
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
    React.createElement('section', { style: { padding: responsive.isMobile ? '60px 20px' : '80px 40px', background: c.surfaceAlt } },
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
    React.createElement('section', { style: { padding: responsive.isMobile ? '60px 20px' : '80px 40px' } },
      React.createElement('div', { style: { maxWidth: '1000px', margin: '0 auto' } },
        React.createElement('div', { style: { textAlign: 'center', marginBottom: '40px' } },
          React.createElement('h2', { style: { fontSize: responsive.isMobile ? FONT_SIZES['2xl'] : FONT_SIZES['3xl'], fontWeight: 800, color: c.text } },
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
        padding: responsive.isMobile ? '60px 20px' : '80px 40px', textAlign: 'center',
        background: COLORS.gradientPrimary, position: 'relative',
      },
    },
      React.createElement('div', { style: { position: 'relative', zIndex: 1 } },
        React.createElement('h2', { style: { fontSize: responsive.isMobile ? FONT_SIZES['2xl'] : FONT_SIZES['4xl'], fontWeight: 900, color: '#fff', marginBottom: '16px' } },
          'Start Your Journey Today'),
        React.createElement('p', { style: { color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZES.md, marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' } },
          'Join thousands of NDIS participants and providers already using NexaConnect.'),
        React.createElement(Button, {
          variant: 'secondary', size: 'lg',
          onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'register'}}),
          style: { background: '#fff', color: COLORS.primary[700], border: 'none' },
        }, 'Get Started Free'),
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
    React.createElement('section', { style: { padding: responsive.isMobile ? '60px 20px' : '80px 40px', background: c.surfaceAlt } },
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
    // Always check demo accounts first
    if (demoLogin()) return;

    // Try Supabase auth if configured
    if (isSupabaseConfigured()) {
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
        const user = { id: data.user.id, name: profile?.name || data.user.email, email: data.user.email, role, tier: profile?.tier || 'free' };
        dispatch({type:ACTION_TYPES.SET_USER,payload:user});
        dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route: role === 'admin' ? 'admin-dashboard' : role === 'provider' ? 'provider-dashboard' : 'participant-dashboard'}});
        dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload:'overview'});
        addToast(`Welcome back, ${user.name}!`, 'success');
      } catch (err) {
        setError('Login failed. Please try again.');
      }
      setLoading(false);
      return;
    }

    setError('Invalid email or password. Try sunshine@provider.com.au / password');
  };

  return React.createElement('div', {
    style: {
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '80px 20px 40px',
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

  const localRegister = (role) => {
    if (role === 'provider') {
      const newProvider = {
        id: 'p' + (state.providers.length + 1), name: formData.businessName || formData.name,
        email: formData.email, password: formData.password, tier: 'free', verified: false,
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
      const user = { id: newProvider.id, name: newProvider.name, email: newProvider.email, role: 'provider', tier: 'free' };
      dispatch({type:ACTION_TYPES.SET_USER,payload:user});
      dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'provider-dashboard'}});
      dispatch({type:ACTION_TYPES.SET_DASHBOARD_TAB,payload:'overview'});
      addToast('Welcome to NexaConnect! Set up your profile to get started.', 'success');
    } else {
      const newParticipant = {
        id: 'u' + (state.participants.length + 1), name: formData.name,
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
          tier: 'free',
        });
        addToast('Account created! Check your email for confirmation.', 'success');
        // Also do local registration so the app works immediately with mock data
        localRegister(role);
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
    style: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px 40px' },
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
      state.registerRole === 'provider' && React.createElement(Select, { label: 'Primary Category', value: formData.category, onChange: v => update('category',v),
        options: [{value:'',label:'Select category'},...CATEGORIES.map(c => ({value:c.id,label:c.name}))] }),

      React.createElement(Button, { variant: 'primary', fullWidth: true, onClick: handleRegister, style: { marginTop: '8px' } },
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
function ProviderCard({ provider, onView, onFavourite, isFavourite }) {
  const { theme } = useTheme();
  const c = COLORS[theme];
  const responsive = useResponsive();
  const tierColors = { premium: '#F59E0B', pro: COLORS.primary[500], free: c.textMuted };
  const tierLabels = { premium: 'Premium', pro: 'Professional', free: 'Starter' };

  return React.createElement(Card, {
    hover: true,
    onClick: () => onView(provider.id),
    style: { cursor: 'pointer', position: 'relative', overflow: 'hidden' },
  },
    // Tier stripe
    React.createElement('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: tierColors[provider.tier] || c.textMuted } }),

    // Header
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' } },
      React.createElement('div', { style: { display: 'flex', gap: '12px', alignItems: 'center', flex: 1 } },
        React.createElement(Avatar, { name: provider.name, size: 48 }),
        React.createElement('div', { style: { flex: 1, minWidth: 0 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' } },
            React.createElement('h3', { style: { fontSize: FONT_SIZES.base, fontWeight: 700, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, provider.name),
            provider.verified && Icons.verified(16, COLORS.accent[500]),
          ),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' } },
            React.createElement(Badge, { variant: provider.tier, size: 'xs' }, tierLabels[provider.tier]),
            React.createElement('span', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted } }, provider.suburb),
          ),
        ),
      ),
      onFavourite && React.createElement('button', {
        onClick: (e) => { e.stopPropagation(); onFavourite(provider.id); },
        style: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: isFavourite ? COLORS.error : c.textMuted },
      }, isFavourite ? Icons.heartFilled(18, COLORS.error) : Icons.heart(18)),
    ),

    // Description
    React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.textSecondary, lineHeight: 1.5, marginBottom: '12px',
      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } },
      provider.tier === 'free' ? provider.shortDescription.slice(0, 200) : provider.shortDescription),

    // Categories
    React.createElement('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' } },
      provider.categories.slice(0, 3).map(catId => {
        const cat = CATEGORIES.find(c => c.id === catId);
        return cat ? React.createElement(Badge, { key: catId, size: 'xs' }, cat.name) : null;
      }),
    ),

    // Footer stats
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: `1px solid ${c.border}` } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
        React.createElement(StarRating, { rating: provider.rating, size: 14 }),
        React.createElement('span', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, marginLeft: '4px' } }, `(${provider.reviewCount})`),
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        React.createElement('span', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, display: 'flex', alignItems: 'center', gap: '3px' } },
          Icons.clock(12, c.textMuted), provider.responseTime),
        React.createElement('span', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, display: 'flex', alignItems: 'center', gap: '3px' } },
          Icons.mapPin(12, c.textMuted), provider.waitTime),
      ),
    ),
  );
}

// ── Directory Page ──
function DirectoryPage() {
  const { theme } = useTheme();
  const { state, dispatch } = useApp();
  const responsive = useResponsive();
  const c = COLORS[theme];
  const [showFilters, setShowFilters] = useState(!responsive.isMobile);

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

  return React.createElement('div', { style: { padding: responsive.isMobile ? '80px 16px 40px' : '80px 32px 40px', maxWidth: '1400px', margin: '0 auto' } },
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
          position: responsive.isMobile ? 'static' : 'sticky', top: '88px', alignSelf: 'flex-start',
          maxHeight: responsive.isMobile ? 'none' : 'calc(100vh - 100px)', overflowY: 'auto',
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
          })),
        ),
      ),
    ),
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

  if (!provider) return React.createElement(EmptyState, { title: 'Provider not found', action: React.createElement(Button, { onClick: () => dispatch({type:ACTION_TYPES.NAV_GOTO,payload:{route:'directory'}}) }, 'Back to Directory') });

  const participant = state.user?.role === 'participant' ? state.participants.find(p => p.id === state.user.id) : null;
  const isFav = participant?.favourites?.includes(provider.id);
  const tierColors = { premium: '#F59E0B', pro: COLORS.primary[500], free: c.textMuted };

  const sendEnquiry = () => {
    if (!state.user || !enquiryText.trim()) { addToast('Please log in and write a message', 'error'); return; }
    dispatch({type:ACTION_TYPES.SEND_ENQUIRY,payload:{
      providerId: provider.id, participantId: state.user.id,
      participantName: state.user.name, providerName: provider.name,
      subject: `Enquiry about ${provider.name}`, message: enquiryText,
    }});
    setEnquiryText('');
    setShowEnquiryModal(false);
    addToast('Enquiry sent successfully!', 'success');
  };

  const submitBooking = () => {
    if (!state.user || !bookingData.date) { addToast('Please fill in booking details', 'error'); return; }
    dispatch({type:ACTION_TYPES.CREATE_BOOKING,payload:{
      providerId: provider.id, participantId: state.user.id,
      participantName: state.user.name, providerName: provider.name,
      service: bookingData.service, date: bookingData.date, time: bookingData.time,
      duration: '1 hour', notes: bookingData.notes,
    }});
    setBookingData({ service: '', date: '', time: '', notes: '' });
    setShowBookingModal(false);
    addToast('Booking request sent!', 'success');
  };

  const submitReview = () => {
    if (!state.user || !reviewData.text.trim()) { addToast('Please write a review', 'error'); return; }
    dispatch({type:ACTION_TYPES.SUBMIT_REVIEW,payload:{
      providerId: provider.id, participantId: state.user.id,
      participantName: state.user.name.split(' ')[0] + ' ' + state.user.name.split(' ').pop()[0] + '.',
      rating: reviewData.rating, text: reviewData.text,
    }});
    setReviewData({ rating: 5, text: '' });
    setShowReviewModal(false);
    addToast('Review submitted!', 'success');
  };

  return React.createElement('div', { style: { padding: responsive.isMobile ? '80px 16px 40px' : '80px 32px 40px', maxWidth: '1000px', margin: '0 auto' } },
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
            React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: FONT_SIZES.sm, color: c.textSecondary } }, Icons.phone(14), provider.phone),
            React.createElement(StarRating, { rating: provider.rating, size: 14, showValue: true }),
            React.createElement('span', { style: { fontSize: FONT_SIZES.sm, color: c.textMuted } }, `(${provider.reviewCount} reviews)`),
          ),
        ),
        React.createElement('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
          participant && React.createElement('button', {
            onClick: () => dispatch({type:ACTION_TYPES.TOGGLE_FAVOURITE,payload:provider.id}),
            style: { background: 'none', border: `1px solid ${c.border}`, borderRadius: RADIUS.md, padding: '8px', cursor: 'pointer', color: isFav ? COLORS.error : c.textMuted },
          }, isFav ? Icons.heartFilled(18, COLORS.error) : Icons.heart(18)),
          React.createElement(Button, { variant: 'secondary', size: 'sm', onClick: () => setShowEnquiryModal(true), icon: Icons.mail(16) }, 'Enquire'),
          provider.tier === 'premium' && React.createElement(Button, { variant: 'primary', size: 'sm', onClick: () => setShowBookingModal(true), icon: Icons.calendar(16) }, 'Book'),
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

function ProviderDashboard() {
  const { theme } = useTheme();
  const { state, dispatch } = useApp();
  const responsive = useResponsive();
  const c = COLORS[theme];
  const { addToast } = useToast();
  const tab = state.dashboardTab;

  const provider = state.providers.find(p => p.email === state.user?.email);
  if (!provider) return React.createElement(EmptyState, { title: 'Provider not found' });

  const myReviews = state.reviews.filter(r => r.providerId === provider.id);
  const myEnquiries = state.enquiries.filter(e => e.providerId === provider.id);
  const myBookings = state.bookings.filter(b => b.providerId === provider.id);
  const analytics = useMemo(() => generateAnalytics(provider), [provider.id]);
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

    // Recent Activity
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: responsive.isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '24px' } },
      // Recent Enquiries
      React.createElement(Card, null,
        React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text, marginBottom: '16px' } }, 'Recent Enquiries'),
        myEnquiries.slice(0, 3).map(e => React.createElement('div', { key: e.id, style: { display: 'flex', gap: '10px', padding: '10px 0', borderBottom: `1px solid ${c.border}` } },
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
        React.createElement('h3', { style: { fontSize: FONT_SIZES.lg, fontWeight: 700, color: c.text, marginBottom: '16px' } }, 'Recent Reviews'),
        myReviews.slice(0, 3).map(r => React.createElement('div', { key: r.id, style: { padding: '10px 0', borderBottom: `1px solid ${c.border}` } },
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
    if (provider.tier === 'free') return React.createElement('div', { style: { padding: '24px 32px' } },
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
    const [editData, setEditData] = useState({
      description: provider.description, shortDescription: provider.shortDescription,
      phone: provider.phone, website: provider.website,
      suburb: provider.suburb, waitTime: provider.waitTime,
    });
    const saveProfile = () => {
      dispatch({type:ACTION_TYPES.UPDATE_PROVIDER_PROFILE,payload:{ id: provider.id, ...editData }});
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
    );
  }

  // ── Inbox Tab ──
  if (tab === 'inbox') {
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [replyText, setReplyText] = useState('');
    const sel = myEnquiries.find(e => e.id === selectedEnquiry);

    const sendReply = () => {
      if (!replyText.trim()) return;
      dispatch({type:ACTION_TYPES.REPLY_ENQUIRY,payload:{enquiryId:selectedEnquiry,text:replyText,from:'provider'}});
      setReplyText('');
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
              onClick: () => { dispatch({type:ACTION_TYPES.CLOSE_ENQUIRY,payload:sel.id}); addToast('Enquiry closed', 'info'); }
            }, 'Close'),
          ),
          React.createElement('div', { style: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' } },
            sel.messages.map((m, i) => React.createElement('div', { key: i, style: { display: 'flex', justifyContent: m.from === 'provider' ? 'flex-end' : 'flex-start' } },
              React.createElement('div', { style: {
                maxWidth: '80%', padding: '10px 14px', borderRadius: RADIUS.md,
                background: m.from === 'provider' ? COLORS.primary[500] : c.surfaceAlt,
                color: m.from === 'provider' ? '#fff' : c.text,
              } },
                React.createElement('p', { style: { fontSize: FONT_SIZES.sm } }, m.text),
                React.createElement('p', { style: { fontSize: FONT_SIZES.xs, marginTop: '4px', opacity: 0.7 } }, `${m.date} ${m.time}`),
              ),
            )),
          ),
          sel.status === 'active' && React.createElement('div', { style: { display: 'flex', gap: '8px' } },
            React.createElement('input', {
              value: replyText, onChange: (e) => setReplyText(e.target.value),
              placeholder: 'Type a reply...',
              onKeyDown: (e) => e.key === 'Enter' && sendReply(),
              style: { flex: 1, padding: '10px 14px', background: c.surfaceAlt, border: `1px solid ${c.border}`, borderRadius: RADIUS.md, color: c.text, outline: 'none', fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm },
            }),
            React.createElement(Button, { variant: 'primary', size: 'sm', onClick: sendReply, icon: Icons.send(16, '#fff') }),
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
            React.createElement(Button, { variant: 'primary', size: 'sm', onClick: () => { dispatch({type:ACTION_TYPES.UPDATE_BOOKING,payload:{id:b.id,status:'confirmed'}}); addToast('Booking confirmed!', 'success'); } }, 'Accept'),
            React.createElement(Button, { variant: 'danger', size: 'sm', onClick: () => { dispatch({type:ACTION_TYPES.UPDATE_BOOKING,payload:{id:b.id,status:'cancelled'}}); addToast('Booking declined', 'info'); } }, 'Decline'),
          ),
        )),
      ),
    );
  }

  // ── Reviews Tab ──
  if (tab === 'reviews') {
    const [replyingTo, setReplyingTo] = useState(null);
    const [responseText, setResponseText] = useState('');
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
        (provider.tier !== 'free' && (replyingTo === r.id ?
          React.createElement('div', { style: { marginTop: '12px', display: 'flex', gap: '8px' } },
            React.createElement('input', { value: responseText, onChange: e => setResponseText(e.target.value), placeholder: 'Write a response...', style: { flex: 1, padding: '8px 12px', background: c.surfaceAlt, border: `1px solid ${c.border}`, borderRadius: RADIUS.md, color: c.text, outline: 'none', fontFamily: FONTS.sans, fontSize: FONT_SIZES.sm } }),
            React.createElement(Button, { variant: 'primary', size: 'sm', onClick: () => {
              dispatch({type:ACTION_TYPES.RESPOND_REVIEW,payload:{reviewId:r.id,response:responseText}});
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
          React.createElement(Badge, { variant: provider.tier, size: 'xs' }, provider.tier.charAt(0).toUpperCase() + provider.tier.slice(1)),
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
                onClick: () => { dispatch({type:ACTION_TYPES.UPGRADE_PLAN,payload:{providerId:provider.id,tier:p.id}}); addToast(`Plan changed to ${p.name}!`, 'success'); },
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
    const [selectedId, setSelectedId] = useState(null);
    const [replyText, setReplyText] = useState('');
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
              React.createElement('div', { style: { maxWidth: '80%', padding: '10px 14px', borderRadius: RADIUS.md, background: m.from === 'participant' ? COLORS.primary[500] : c.surfaceAlt, color: m.from === 'participant' ? '#fff' : c.text } },
                React.createElement('p', { style: { fontSize: FONT_SIZES.sm } }, m.text),
                React.createElement('p', { style: { fontSize: FONT_SIZES.xs, marginTop: '4px', opacity: 0.7 } }, `${m.date} ${m.time}`),
              ),
            )),
          ),
          sel.status === 'active' && React.createElement('div', { style: { display: 'flex', gap: '8px' } },
            React.createElement('input', { value: replyText, onChange: e => setReplyText(e.target.value), placeholder: 'Type a reply...', onKeyDown: e => { if (e.key==='Enter' && replyText.trim()) { dispatch({type:ACTION_TYPES.REPLY_ENQUIRY,payload:{enquiryId:sel.id,text:replyText,from:'participant'}}); setReplyText(''); addToast('Reply sent!','success'); }},
              style: { flex:1,padding:'10px 14px',background:c.surfaceAlt,border:`1px solid ${c.border}`,borderRadius:RADIUS.md,color:c.text,outline:'none',fontFamily:FONTS.sans,fontSize:FONT_SIZES.sm } }),
            React.createElement(Button, { variant:'primary',size:'sm',onClick:() => { if (replyText.trim()) { dispatch({type:ACTION_TYPES.REPLY_ENQUIRY,payload:{enquiryId:sel.id,text:replyText,from:'participant'}}); setReplyText(''); addToast('Reply sent!','success'); }}, icon: Icons.send(16,'#fff') }),
          ),
        ),
      ),
    );
  }

  // ── Bookings ──
  if (tab === 'bookings') return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
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
        ),
        b.notes && React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, marginTop: '8px' } }, b.notes),
        b.status !== 'cancelled' && React.createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => { dispatch({type:ACTION_TYPES.CANCEL_BOOKING,payload:b.id}); addToast('Booking cancelled','info'); }, style: { marginTop: '12px', color: COLORS.error } }, 'Cancel Booking'),
      )),
    ),
  );

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
    const [editData, setEditData] = useState({ name: participant.name, suburb: participant.suburb || '', phone: '' });
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
        React.createElement(Input, { label: 'Name', value: editData.name, onChange: v => setEditData(p=>({...p,name:v})) }),
        React.createElement(Select, { label: 'Suburb', value: editData.suburb, onChange: v => setEditData(p=>({...p,suburb:v})),
          options: [{value:'',label:'Select'},...SUBURBS.map(s=>({value:s,label:s}))] }),
        React.createElement(Button, { variant: 'primary', onClick: () => {
          dispatch({type:ACTION_TYPES.UPDATE_PARTICIPANT_PROFILE,payload:{id:participant.id,...editData}});
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

  const totalProviders = state.providers.length;
  const totalParticipants = state.participants.length;
  const premiumCount = state.providers.filter(p => p.tier === 'premium').length;
  const proCount = state.providers.filter(p => p.tier === 'pro').length;
  const freeCount = state.providers.filter(p => p.tier === 'free').length;
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
          { text: 'New provider registered: Sunshine Support', time: '2 hours ago', type: 'info' },
          { text: 'Premium upgrade: PhysioPlus Disability', time: '4 hours ago', type: 'success' },
          { text: 'New review submitted for MindBridge', time: '6 hours ago', type: 'info' },
          { text: 'New participant: Sarah Mitchell', time: '8 hours ago', type: 'info' },
          { text: 'Booking confirmed: Little Stars', time: '12 hours ago', type: 'success' },
          { text: 'Support ticket: Plan management query', time: '1 day ago', type: 'warning' },
        ].map((a, i) => React.createElement('div', { key: i, style: { display: 'flex', gap: '10px', padding: '8px 0', borderBottom: i < 5 ? `1px solid ${c.border}` : 'none' } },
          React.createElement('div', { style: { width: 8, height: 8, borderRadius: '50%', marginTop: '6px', flexShrink: 0, background: a.type === 'success' ? COLORS.success : a.type === 'warning' ? COLORS.warning : COLORS.info } }),
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.text } }, a.text),
            React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted } }, a.time),
          ),
        )),
      ),
    ),
  );

  // ── Users Tab ──
  if (tab === 'users') {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
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
              ['Name','Email','Role','Status'].map(h => React.createElement('th', { key: h, style: { textAlign: 'left', padding: '10px 12px', fontSize: FONT_SIZES.xs, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', borderBottom: `1px solid ${c.border}` } }, h)),
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
      state.providers.map(p => React.createElement(Card, { key: p.id },
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

  // ── Activity Tab ──
  if (tab === 'activity') return React.createElement('div', { style: { padding: responsive.isMobile ? '20px 16px' : '24px 32px' } },
    React.createElement('h2', { style: { fontSize: FONT_SIZES['2xl'], fontWeight: 800, color: c.text, marginBottom: '24px' } }, 'Activity Feed'),
    React.createElement(Card, null,
      [
        { text: 'Sarah Mitchell sent an enquiry to Sunshine Support', time: '30 minutes ago', type: 'info' },
        { text: 'PhysioPlus Disability upgraded to Premium plan', time: '1 hour ago', type: 'success' },
        { text: 'New review: 5 stars for MindBridge Psychology', time: '2 hours ago', type: 'success' },
        { text: 'James Chen booked hydrotherapy at PhysioPlus', time: '3 hours ago', type: 'info' },
        { text: 'New provider registered: Garden Therapy Co', time: '5 hours ago', type: 'info' },
        { text: 'CareFirst Plan Management responded to review', time: '6 hours ago', type: 'info' },
        { text: 'Booking cancelled: Happy Days Community', time: '8 hours ago', type: 'warning' },
        { text: 'New participant: Emma Johnson from Merewether', time: '10 hours ago', type: 'info' },
        { text: 'Little Stars Early Intervention hit 50 reviews', time: '12 hours ago', type: 'success' },
        { text: 'Harmony SIL Homes updated their profile', time: '1 day ago', type: 'info' },
        { text: 'TechAssist AT Solutions added new photos', time: '1 day ago', type: 'info' },
        { text: 'Monthly billing processed: $2,847 collected', time: '2 days ago', type: 'success' },
      ].map((a, i) => React.createElement('div', { key: i, style: { display: 'flex', gap: '12px', padding: '12px 0', borderBottom: `1px solid ${c.border}` } },
        React.createElement('div', { style: { width: 10, height: 10, borderRadius: '50%', marginTop: '5px', flexShrink: 0, background: a.type === 'success' ? COLORS.success : a.type === 'warning' ? COLORS.warning : COLORS.info } }),
        React.createElement('div', { style: { flex: 1 } },
          React.createElement('p', { style: { fontSize: FONT_SIZES.sm, color: c.text } }, a.text),
          React.createElement('p', { style: { fontSize: FONT_SIZES.xs, color: c.textMuted, marginTop: '2px' } }, a.time),
        ),
      )),
    ),
  );

  return null;
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
          const user = { id: session.user.id, name: profile.name || session.user.email, email: session.user.email, role, tier: profile.tier || 'free' };
          dispatch({ type: ACTION_TYPES.SET_USER, payload: user });
          dispatch({ type: ACTION_TYPES.NAV_GOTO, payload: { route: role === 'admin' ? 'admin-dashboard' : role === 'provider' ? 'provider-dashboard' : 'participant-dashboard' } });
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
        React.createElement(PageShell, null,
          React.createElement(AppRouter),
        ),
      ),
    ),
  );
}

export default App;
