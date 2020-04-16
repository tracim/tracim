import i18n from 'i18next'
import { reactI18nextModule } from 'react-i18next'
import { frTranslation, enTranslation, ptTranslation } from 'tracim_frontend_lib'
import en from '../i18next.scanner/en/translation.json'
import fr from '../i18next.scanner/fr/translation.json'
import pt from '../i18next.scanner/pt/translation.json'

// get translation files of apps
// theses files are generated by build_appname.sh
const htmlDocEnTranslation = require('../dist/app/html-document_en_translation.json') || {}
const htmlDocFrTranslation = require('../dist/app/html-document_fr_translation.json') || {}
const htmlDocPtTranslation = require('../dist/app/html-document_pt_translation.json') || {}
const threadEnTranslation = require('../dist/app/thread_en_translation.json') || {}
const threadFrTranslation = require('../dist/app/thread_fr_translation.json') || {}
const threadPtTranslation = require('../dist/app/thread_pt_translation.json') || {}
const fileEnTranslation = require('../dist/app/file_en_translation.json') || {}
const fileFrTranslation = require('../dist/app/file_fr_translation.json') || {}
const filePtTranslation = require('../dist/app/file_pt_translation.json') || {}
const folderEnTranslation = require('../dist/app/folder_en_translation.json') || {}
const folderFrTranslation = require('../dist/app/folder_fr_translation.json') || {}
const folderPtTranslation = require('../dist/app/folder_pt_translation.json') || {}
const adminWsUserEnTranslation = require('../dist/app/admin_workspace_user_en_translation.json') || {}
const adminWsUserFrTranslation = require('../dist/app/admin_workspace_user_fr_translation.json') || {}
const adminWsUserPtTranslation = require('../dist/app/admin_workspace_user_pt_translation.json') || {}
const wsAdvancedEnTranslation = require('../dist/app/workspace_advanced_en_translation.json') || {}
const wsAdvancedFrTranslation = require('../dist/app/workspace_advanced_fr_translation.json') || {}
const wsAdvancedPtTranslation = require('../dist/app/workspace_advanced_pt_translation.json') || {}
const wsEnTranslation = require('../dist/app/workspace_en_translation.json')
const wsFrTranslation = require('../dist/app/workspace_fr_translation.json')
const wsPtTranslation = require('../dist/app/workspace_pt_translation.json')
const agendaEnTranslation = require('../dist/app/agenda_en_translation.json')
const agendaFrTranslation = require('../dist/app/agenda_fr_translation.json')
const agendaPtTranslation = require('../dist/app/agenda_fr_translation.json')
const collaborativeDocumentEditionEnTranslation = require('../dist/app/collaborative_document_edition_en_translation.json')
const collaborativeDocumentEditionFrTranslation = require('../dist/app/collaborative_document_edition_fr_translation.json')
const collaborativeDocumentEditionPtTranslation = require('../dist/app/collaborative_document_edition_pt_translation.json')
const shareFolderEnTranslation = require('../dist/app/share_folder_en_translation.json')
const shareFolderFrTranslation = require('../dist/app/share_folder_fr_translation.json')
const shareFolderPtTranslation = require('../dist/app/share_folder_pt_translation.json')
const galleryEnTranslation = require('../dist/app/gallery_en_translation.json')
const galleryFrTranslation = require('../dist/app/gallery_fr_translation.json')
const galleryPtTranslation = require('../dist/app/gallery_pt_translation.json')

export const getBrowserLang = () => {
  const browserLang = navigator.language

  if (['en', 'fr', 'pt'].includes(browserLang)) return browserLang
  if (browserLang.includes('fr')) return 'fr' // for fr-XX
  if (browserLang.includes('pt')) return 'pt' // for pt-XX

  return 'en'
}

i18n
  .use(reactI18nextModule)
  .init({
    fallbackLng: getBrowserLang(),
    // have a common namespace used around the full app
    ns: ['translation'], // namespace
    defaultNS: 'translation',
    nsSeparator: false,
    keySeparator: false,
    debug: false,
    resources: {
      en: {
        translation: {
          ...enTranslation, // frontend_lib
          ...en, // frontend
          ...htmlDocEnTranslation, // html-document
          ...threadEnTranslation, // thread
          ...fileEnTranslation, // file
          ...folderEnTranslation, // folder
          ...wsAdvancedEnTranslation, // advanced workspace
          ...adminWsUserEnTranslation, // admin workspace user
          ...wsEnTranslation, // workspace
          ...agendaEnTranslation, // agenda
          ...collaborativeDocumentEditionEnTranslation,
          ...shareFolderEnTranslation, // share folder,
          ...galleryEnTranslation // gallery
        }
      },
      fr: {
        translation: {
          ...frTranslation, // frontend_lib
          ...fr, // frontend
          ...htmlDocFrTranslation, // html-document
          ...threadFrTranslation, // thread
          ...fileFrTranslation, // file
          ...folderFrTranslation, // folder
          ...wsAdvancedFrTranslation, // advanced workspace
          ...adminWsUserFrTranslation, // admin workspace user
          ...wsFrTranslation, // workspace
          ...agendaFrTranslation, // agenda
          ...collaborativeDocumentEditionFrTranslation,
          ...shareFolderFrTranslation, // share folder
          ...galleryFrTranslation // gallery
        }
      },
      pt: {
        translation: {
          ...ptTranslation, // frontend_lib
          ...pt, // frontend
          ...htmlDocPtTranslation, // html-document
          ...threadPtTranslation, // thread
          ...filePtTranslation, // file
          ...folderPtTranslation, // folder
          ...wsAdvancedPtTranslation, // advanced workspace
          ...adminWsUserPtTranslation, // admin workspace user
          ...wsPtTranslation, // workspace
          ...agendaPtTranslation, // agenda
          ...collaborativeDocumentEditionPtTranslation,
          ...shareFolderPtTranslation, // share folder
          ...galleryPtTranslation // gallery
        }
      }
    }
  })

i18n.tracimId = 'frontend'

export default i18n
