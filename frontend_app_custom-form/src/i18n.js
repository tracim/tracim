import i18n from 'i18next'
import { reactI18nextModule } from 'react-i18next'
import { getBrowserLang } from 'tracim_frontend_lib'

i18n
  .use(reactI18nextModule)
  .init({
    fallbackLng: getBrowserLang(),
    // have a common namespace used around the full app
    returnEmptyString: false,
    ns: ['translation'], // namespace
    defaultNS: 'translation',
    debug: false,
    // interpolation: {
    //   escapeValue: false, // not needed for react!!
    // },
    react: {
      wait: true
    },
    resources: {} // init with empty resources, they will come from frontend in app constructor
  })

i18n.idTracim = 'frontend_app_formgenerator'

export default i18n
