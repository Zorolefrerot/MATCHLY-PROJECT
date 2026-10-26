import { StrictMode, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PublicCatalogPage } from './components/PublicCatalogPage';
import { PublicOrderPage } from './components/PublicOrderPage';
import './index.css';

interface PublicRoute {
  catalogToken: string | null;
  orderToken: string | null;
}

function readPublicRoute(): PublicRoute {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return {
    catalogToken: query.get('catalog'),
    orderToken: hash.get('order'),
  };
}

function ApplicationEntry() {
  const [route, setRoute] = useState(readPublicRoute);

  useEffect(() => {
    const updateRoute = () => setRoute(readPublicRoute());
    window.addEventListener('popstate', updateRoute);
    window.addEventListener('hashchange', updateRoute);
    return () => {
      window.removeEventListener('popstate', updateRoute);
      window.removeEventListener('hashchange', updateRoute);
    };
  }, []);

  if (route.orderToken) return <PublicOrderPage token={route.orderToken} />;
  return route.catalogToken ? <PublicCatalogPage token={route.catalogToken} /> : <App />;
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
