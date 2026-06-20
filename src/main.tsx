import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Only register manually if OneSignal is not active, otherwise let OneSignal handle registration to avoid script URL query param conflicts.
    let isOneSignalEnabled = false;
    try {
      const rawConfig = localStorage.getItem('pars_config_onesignal');
      if (rawConfig) {
        const config = JSON.parse(rawConfig);
        if (config && config.isEnabled && config.appId) {
          isOneSignalEnabled = true;
        }
      }
    } catch (e) {
      console.error('Error parsing onesignal config in main.tsx:', e);
    }

    if (!isOneSignalEnabled) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('Service Worker registered successfully with scope: ', reg.scope);
        })
        .catch(err => {
          console.error('Service Worker registration failed: ', err);
        });
    } else {
      console.log('OneSignal is enabled, delegating Service Worker registration to OneSignal SDK.');
    }
  });
}

