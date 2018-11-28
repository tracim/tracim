import i18n from 'i18next'
import { reactI18nextModule } from 'react-i18next'
import en from '../i18next.scanner/en/translation.json'
import fr from '../i18next.scanner/fr/translation.json'

i18n
  .use(reactI18nextModule)
  .init({
    fallbackLng: 'en',
    // have a common namespace used around the full app
    ns: ['translation'], // namespace
    defaultNS: 'translation',
    debug: false,
    // interpolation: {
    //   escapeValue: false, // not needed for react!!
    // },
    react: {
      wait: true
    },
    resources: {
      en: {
        translation: en
      },
      fr: {
        translation: fr
      }
    }
  })

i18n.idTracim = 'frontend_lib'

export default i18n
