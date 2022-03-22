import i18n from 'i18next'
import { reactI18nextModule } from 'react-i18next'
import en from '../i18next.scanner/en/translation.json'
import fr from '../i18next.scanner/fr/translation.json'
import pt from '../i18next.scanner/pt/translation.json'
import de from '../i18next.scanner/de/translation.json'
import ar from '../i18next.scanner/ar/translation.json'

export const getBrowserLang = () => {
  const browserLang = navigator.language

  if (['en', 'fr', 'pt', 'de', 'ar'].includes(browserLang)) return browserLang
  if (browserLang.includes('fr')) return 'fr' // for fr-XX
  if (browserLang.includes('pt')) return 'pt' // for pt-XX
  if (browserLang.includes('de')) return 'de' // for de-XX
  if (browserLang.includes('ar')) return 'ar' // for de-XX

  return 'en'
}

i18n
  .use(reactI18nextModule)
  .init({
    fallbackLng: getBrowserLang(),
    // have a common namespace used around the full app
    returnEmptyString: false,
    ns: ['translation'], // namespace
    defaultNS: 'translation',
    nsSeparator: false,
    keySeparator: false,
    debug: false,
    // interpolation: {
    //   escapeValue: false, // not needed for react!!
    // },
    resources: {
      en: {
        translation: en
      },
      fr: {
        translation: fr
      },
      pt: {
        translation: pt
      },
      de: {
        translation: de
      },
      ar: {
        translation: ar
      }
    }
  })

i18n.tracimId = 'frontend_lib'

export default i18n
