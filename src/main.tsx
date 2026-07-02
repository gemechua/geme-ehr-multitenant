import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { injectSpeedInsights } from '@vercel/speed-insights';

// Intercept console.error and console.warn to suppress non-critical Firestore connectivity warnings
const originalError = console.error;
const originalWarn = console.warn;

const isFirestoreConnectionWarning = (...args: any[]): boolean => {
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  return (
    msg.includes('@firebase/firestore') ||
    msg.includes('Could not reach Cloud Firestore backend') ||
    msg.includes("Backend didn't respond within 10 seconds") ||
    msg.includes('The client will operate in offline mode') ||
    msg.includes('code=unavailable')
  );
};

console.error = (...args: any[]) => {
  if (isFirestoreConnectionWarning(...args)) {
    return;
  }
  originalError(...args);
};

console.warn = (...args: any[]) => {
  if (isFirestoreConnectionWarning(...args)) {
    return;
  }
  originalWarn(...args);
};

// Register Service Worker for PWA
import { registerSW } from 'virtual:pwa-register';

if ('serviceWorker' in navigator) {
  registerSW();
}

// Initialize Vercel Speed Insights
injectSpeedInsights();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
