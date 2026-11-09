import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import type { AppLanguage } from '../types';

export const APP_LANGUAGES: readonly AppLanguage[] = ['fr', 'en', 'ln', 'sw', 'zh'];
export const LANGUAGE_STORAGE_KEY = 'shopflow_language_v1';

function storedLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && APP_LANGUAGES.includes(saved as AppLanguage)) return saved as AppLanguage;
  } catch {
    // Storage may be unavailable in private browsing; French remains the safe default.
  }
  return 'fr';
}

void i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: storedLanguage(),
    fallbackLng: 'fr',
    supportedLngs: [...APP_LANGUAGES],
    load: 'languageOnly',
    ns: ['translation'],
    defaultNS: 'translation',
    keySeparator: false,
    returnNull: false,
    interpolation: { escapeValue: false },
    backend: {
      loadPath: `${import.meta.env.BASE_URL}locales/{{lng}}/translation.json`,
      requestOptions: { cache: 'force-cache' },
    },
    react: { useSuspense: false },
  });

i18n.on('languageChanged', (language) => {
  if (!APP_LANGUAGES.includes(language as AppLanguage)) return;
  if (typeof document !== 'undefined') document.documentElement.lang = language;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // The current language still works for this session if storage is disabled.
  }
});

export default i18n;
