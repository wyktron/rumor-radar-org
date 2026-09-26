import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import fr from './locales/fr';
import es from './locales/es';
import ru from './locales/ru';
import ar from './locales/ar';
import ro from './locales/ro';

export const SUPPORTED_LANGS = [
  { code: 'en', label: 'English', short: 'EN', dir: 'ltr' },
  { code: 'fr', label: 'Français', short: 'FR', dir: 'ltr' },
  { code: 'es', label: 'Español', short: 'ES', dir: 'ltr' },
  { code: 'ru', label: 'Русский', short: 'RU', dir: 'ltr' },
  { code: 'ro', label: 'Română', short: 'RO', dir: 'ltr' },
  { code: 'ar', label: 'العربية', short: 'AR', dir: 'rtl' },
] as const;

export type LangCode = typeof SUPPORTED_LANGS[number]['code'];

// MVP: English only. Other locales stay bundled for later re-activation.
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
      ru: { translation: ru },
      ro: { translation: ro },
      ar: { translation: ar },
    },
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en'],
    interpolation: { escapeValue: false },
  });


// Keep <html lang> and dir in sync
const applyHtmlAttrs = (lng: string) => {
  if (typeof document === 'undefined') return;
  const meta = SUPPORTED_LANGS.find((l) => l.code === lng) ?? SUPPORTED_LANGS[0];
  document.documentElement.lang = meta.code;
  document.documentElement.dir = meta.dir;
};
applyHtmlAttrs(i18n.language);
i18n.on('languageChanged', applyHtmlAttrs);

export default i18n;
