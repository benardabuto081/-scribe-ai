import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import sw from './locales/sw.json';

export const SUPPORTED_LANGUAGES = ['en', 'sw'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('scribe.lang') : null;
const initial: Language = stored === 'sw' ? 'sw' : 'en';

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, sw: { translation: sw } },
  lng: initial,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export function setLanguage(lang: Language): void {
  void i18n.changeLanguage(lang);
  localStorage.setItem('scribe.lang', lang);
  document.documentElement.lang = lang;
}

export default i18n;
