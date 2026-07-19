import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import './styles.css';

registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info('Versi baru Root Fact App siap digunakan.');
  },
  onOfflineReady() {
    console.info('Root Fact App siap berjalan offline.');
  }
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
