import i18n from 'i18next'
import { reactI18nextModule } from 'react-i18next'
import { langFr, langEn } from 'tracim_lib'
import fr from './translate/fr.js'
import en from './translate/en.js'

i18n
  .use(reactI18nextModule)
  .init({
    fallbackLng: 'fr',
    // have a common namespace used around the full app
    ns: ['translation'], // namespace
    defaultNS: 'translation',
    debug: true,
    // interpolation: {
    //   escapeValue: false, // not needed for react!!
    // },
    react: {
      wait: true
    },
    resources: {
      en: {
        translation: {...langEn.translation, ...en.translation}
      },
      fr: {
        translation: {...langFr.translation, ...fr.translation}
      }
    }
  })

export default i18n
