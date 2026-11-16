import type { AppLanguage } from '../types';

export interface LanguageOption {
  code: AppLanguage;
  nativeLabel: string;
  flag: string;
}

/** The same five options are shared by the app header, settings and showcase. */
export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { code: 'fr', nativeLabel: 'Français', flag: '🇫🇷' },
  { code: 'en', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'ln', nativeLabel: 'Lingala (RDC)', flag: '🇨🇩' },
  { code: 'sw', nativeLabel: 'Kiswahili', flag: '🇹🇿' },
  { code: 'zh', nativeLabel: '简体中文', flag: '🇨🇳' },
];
