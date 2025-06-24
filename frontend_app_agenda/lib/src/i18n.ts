import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from '../locales/en/translation.json'
import fr from '../locales/fr/translation.json'

i18n.use(LanguageDetector).init({
  fallbackLng: 'en',
  partialBundledLanguages: true,
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
})

export default i18n
