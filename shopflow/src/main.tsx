import { StrictMode, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PublicCatalogPage } from './components/PublicCatalogPage';
import './index.css';

function ApplicationEntry() {
  const [catalogToken, setCatalogToken] = useState(() =>
    new URLSearchParams(window.location.search).get('catalog')
  );

  useEffect(() => {
    const updateRoute = () =>
      setCatalogToken(new URLSearchParams(window.location.search).get('catalog'));
    window.addEventListener('popstate', updateRoute);
    return () => window.removeEventListener('popstate', updateRoute);
  }, []);

  return catalogToken ? <PublicCatalogPage token={catalogToken} /> : <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApplicationEntry />
  </StrictMode>
);

// Install a service worker only for the browser/PWA build, never inside the native Capacitor shells.
if (import.meta.env.PROD && !Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // The application remains usable online if the browser blocks service-worker registration.
    });
  });
}
