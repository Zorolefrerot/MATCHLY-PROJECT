import { StrictMode, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import i18n from './i18n';
import { I18nextProvider } from 'react-i18next';
import { PublicCatalogPage } from './components/PublicCatalogPage';
import { PublicOrderPage } from './components/PublicOrderPage';
import './index.css';
import type { AppLanguage } from './types';
import { translateDOMWithI18next } from './i18n/fullTranslator';

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
  const i18nRootRef = useRef<HTMLDivElement>(null);
  const { i18n } = useTranslation();

  useEffect(() => {
    const updateRoute = () => setRoute(readPublicRoute());
    window.addEventListener('popstate', updateRoute);
    window.addEventListener('hashchange', updateRoute);
    return () => {
      window.removeEventListener('popstate', updateRoute);
      window.removeEventListener('hashchange', updateRoute);
    };
  }, []);

  useEffect(() => {
    const root = i18nRootRef.current;
    if (!root) return;
    let timer = 0;
    const language = (i18n.resolvedLanguage || i18n.language || 'fr').split('-')[0] as AppLanguage;
    const translate = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { void translateDOMWithI18next(root, language); }, 80);
    };
    translate();
    const observer = new MutationObserver(translate);
    observer.observe(root, { childList: true, characterData: true, subtree: true });
    i18n.on('languageChanged', translate);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      i18n.off('languageChanged', translate);
    };
  }, [route, i18n, i18n.resolvedLanguage]);

  return (
    <div ref={i18nRootRef}>
      {route.orderToken
        ? <PublicOrderPage token={route.orderToken} />
        : route.catalogToken ? <PublicCatalogPage token={route.catalogToken} /> : <App />}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <ApplicationEntry />
    </I18nextProvider>
  </StrictMode>
);

// Install a service worker only for the browser/PWA build, never inside the native Capacitor shells.
if (import.meta.env.PROD && !Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => registration.update())
      .catch(() => {
        // The application remains usable online if the browser blocks service-worker registration.
      });
  });
}
