import React from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'

// Global error handler to catch errors outside React's error boundary
window.onerror = (msg, source, line, col, error) => {
  const el = document.getElementById('global-error');
  if (el) {
    el.style.display = 'block';
    el.innerHTML = `<h3 style="color:#ef4444;margin-bottom:8px">JavaScript Error</h3><pre style="background:#1a1a2e;color:#f87171;padding:16px;border-radius:8px;overflow:auto;font-size:13px;max-height:300px">${msg}\n${source}:${line}:${col}\n${error?.stack || ''}</pre>`;
  }
  console.error('Global error:', msg, source, line, col, error);
};
window.onunhandledrejection = (e) => {
  console.error('Unhandled promise rejection:', e.reason);
};

// Add error display element
const errorDiv = document.createElement('div');
errorDiv.id = 'global-error';
errorDiv.style.cssText = 'display:none;position:fixed;top:20px;left:20px;right:20px;z-index:99999;padding:20px;background:#0a0a0f;border:2px solid #ef4444;border-radius:12px;font-family:system-ui';
document.body.appendChild(errorDiv);

createRoot(document.getElementById('root')).render(
  <>
    <App />
    <Analytics />
  </>,
)
