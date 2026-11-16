import i18n from './index';
import type { AppLanguage } from '../types';

/** Translate a known source phrase through the bundled, offline i18next resources. */
export function translateStringSync(text: string, lang: AppLanguage): string {
  if (!text || lang === 'fr') return text;
  return String(i18n.t(text, { lng: lang, defaultValue: text }));
}

/**
 * Compatibility bridge for legacy React views while their literals are migrated to
 * useTranslation keys. Translation data is loaded from same-origin locale JSON files;
 * the service worker precaches those files for installed/offline use.
 */
export async function translateDOMWithI18next(
  rootEl: HTMLElement | null,
  lang: AppLanguage,
  onComplete?: () => void,
): Promise<void> {
  if (!rootEl) return;
  try {
    await i18n.loadLanguages(lang);
  } catch {
    // i18next's configured French fallback remains available if a locale fetch fails.
  }

  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    const textNode = current as Text & { __sfI18nOriginal?: string; __sfI18nLast?: string };
    const parent = textNode.parentElement;
    const parentTag = parent?.tagName.toLowerCase();
    const ignored = parent?.closest(
      '[data-i18n-ignore], [contenteditable="true"], script, style, .katex, textarea, input, select',
    );
    if (
      !ignored && parentTag !== 'script' && parentTag !== 'style' &&
      textNode.nodeValue && textNode.nodeValue.trim().length > 1
    ) {
      const value = textNode.nodeValue;
      if (
        textNode.__sfI18nOriginal === undefined ||
        (textNode.__sfI18nLast !== undefined && value !== textNode.__sfI18nLast)
      ) {
        textNode.__sfI18nOriginal = value;
        textNode.__sfI18nLast = undefined;
      }
      const original = textNode.__sfI18nOriginal;
      const trimmed = original.trim();
      const translated = lang === 'fr'
        ? original
        : String(i18n.t(trimmed, { lng: lang, defaultValue: trimmed }));
      const output = translated === trimmed
        ? original
        : original.replace(trimmed, translated);
      if (textNode.nodeValue !== output) textNode.nodeValue = output;
      textNode.__sfI18nLast = output;
    }
    current = walker.nextNode();
  }

  rootEl.querySelectorAll<HTMLElement>('[placeholder], [title], [aria-label]').forEach((element) => {
    for (const attribute of ['placeholder', 'title', 'aria-label']) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      const key = `__sfI18n_${attribute}`;
      const tagged = element as HTMLElement & Record<string, string | undefined>;
      if (tagged[key] === undefined || tagged[`${key}Last`] !== value) {
        tagged[key] = value;
        tagged[`${key}Last`] = undefined;
      }
      const original = tagged[key] || value;
      const translated = lang === 'fr'
        ? original
        : String(i18n.t(original.trim(), { lng: lang, defaultValue: original.trim() }));
      const output = translated === original.trim() ? original : original.replace(original.trim(), translated);
      element.setAttribute(attribute, output);
      tagged[`${key}Last`] = output;
    }
  });

  onComplete?.();
}
