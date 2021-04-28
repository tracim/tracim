import i18n from 'i18next'
import { reactI18nextModule } from 'react-i18next'
import en from '../i18next.scanner/en/translation.json'
import fr from '../i18next.scanner/fr/translation.json'
import pt from '../i18next.scanner/pt/translation.json'
import de from '../i18next.scanner/de/translation.json'


i18n
  .use(reactI18nextModule)
  .init({
    fallbackLng: 'en',
    // have a common namespace used around the full app
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
      }
    }
  })

i18n.tracimId = 'frontend_lib'

export default i18n
