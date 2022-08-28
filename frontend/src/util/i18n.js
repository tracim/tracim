import i18n from 'i18next'
import { reactI18nextModule } from 'react-i18next'
import {
  getBrowserLang,
  frTranslation,
  enTranslation,
  ptTranslation,
  deTranslation,
  arTranslation,
  esTranslation,
  nbNOTranslation
} from 'tracim_frontend_lib'
import en from '../../i18next.scanner/en/translation.json'
import fr from '../../i18next.scanner/fr/translation.json'
import pt from '../../i18next.scanner/pt/translation.json'
import de from '../../i18next.scanner/de/translation.json'
import ar from '../../i18next.scanner/ar/translation.json'
import es from '../../i18next.scanner/es/translation.json'
import nb_NO from '../../i18next.scanner/nb_NO/translation.json'

// get translation files of apps
// theses files are generated by build_app.sh
const htmlDocEnTranslation = require('../../dist/app/html-document_en_translation.json') || {}
const htmlDocFrTranslation = require('../../dist/app/html-document_fr_translation.json') || {}
const htmlDocPtTranslation = require('../../dist/app/html-document_pt_translation.json') || {}
const htmlDocDeTranslation = require('../../dist/app/html-document_de_translation.json') || {}
const htmlDocArTranslation = require('../../dist/app/html-document_ar_translation.json') || {}
const htmlDocEsTranslation = require('../../dist/app/html-document_es_translation.json') || {}
const htmlDocNbNOTranslation = require('../../dist/app/html-document_nb_NO_translation.json') || {}
const threadEnTranslation = require('../../dist/app/thread_en_translation.json') || {}
const threadFrTranslation = require('../../dist/app/thread_fr_translation.json') || {}
const threadPtTranslation = require('../../dist/app/thread_pt_translation.json') || {}
const threadDeTranslation = require('../../dist/app/thread_de_translation.json') || {}
const threadArTranslation = require('../../dist/app/thread_ar_translation.json') || {}
const threadEsTranslation = require('../../dist/app/thread_es_translation.json') || {}
const threadNbNOTranslation = require('../../dist/app/thread_nb_NO_translation.json') || {}
const fileEnTranslation = require('../../dist/app/file_en_translation.json') || {}
const fileFrTranslation = require('../../dist/app/file_fr_translation.json') || {}
const filePtTranslation = require('../../dist/app/file_pt_translation.json') || {}
const fileDeTranslation = require('../../dist/app/file_de_translation.json') || {}
const fileArTranslation = require('../../dist/app/file_ar_translation.json') || {}
const fileEsTranslation = require('../../dist/app/file_es_translation.json') || {}
const fileNbNOTranslation = require('../../dist/app/file_nb_NO_translation.json') || {}
const folderEnTranslation = require('../../dist/app/folder_en_translation.json') || {}
const folderFrTranslation = require('../../dist/app/folder_fr_translation.json') || {}
const folderPtTranslation = require('../../dist/app/folder_pt_translation.json') || {}
const folderDeTranslation = require('../../dist/app/folder_de_translation.json') || {}
const folderArTranslation = require('../../dist/app/folder_ar_translation.json') || {}
const folderEsTranslation = require('../../dist/app/folder_es_translation.json') || {}
const folderNbNOTranslation = require('../../dist/app/folder_nb_NO_translation.json') || {}
const adminWsUserEnTranslation = require('../../dist/app/admin_workspace_user_en_translation.json') || {}
const adminWsUserFrTranslation = require('../../dist/app/admin_workspace_user_fr_translation.json') || {}
const adminWsUserPtTranslation = require('../../dist/app/admin_workspace_user_pt_translation.json') || {}
const adminWsUserDeTranslation = require('../../dist/app/admin_workspace_user_de_translation.json') || {}
const adminWsUserArTranslation = require('../../dist/app/admin_workspace_user_ar_translation.json') || {}
const adminWsUserEsTranslation = require('../../dist/app/admin_workspace_user_es_translation.json') || {}
const adminWsUserNbNOTranslation = require('../../dist/app/admin_workspace_user_nb_NO_translation.json') || {}
const wsAdvancedEnTranslation = require('../../dist/app/workspace_advanced_en_translation.json') || {}
const wsAdvancedFrTranslation = require('../../dist/app/workspace_advanced_fr_translation.json') || {}
const wsAdvancedPtTranslation = require('../../dist/app/workspace_advanced_pt_translation.json') || {}
const wsAdvancedDeTranslation = require('../../dist/app/workspace_advanced_de_translation.json') || {}
const wsAdvancedArTranslation = require('../../dist/app/workspace_advanced_ar_translation.json') || {}
const wsAdvancedEsTranslation = require('../../dist/app/workspace_advanced_es_translation.json') || {}
const wsAdvancedNbNOTranslation = require('../../dist/app/workspace_advanced_nb_NO_translation.json') || {}
const wsEnTranslation = require('../../dist/app/workspace_en_translation.json')
const wsFrTranslation = require('../../dist/app/workspace_fr_translation.json')
const wsPtTranslation = require('../../dist/app/workspace_pt_translation.json')
const wsDeTranslation = require('../../dist/app/workspace_de_translation.json')
const wsArTranslation = require('../../dist/app/workspace_ar_translation.json')
const wsEsTranslation = require('../../dist/app/workspace_es_translation.json')
const wsNbNOTranslation = require('../../dist/app/workspace_nb_NO_translation.json')
const agendaEnTranslation = require('../../dist/app/agenda_en_translation.json')
const agendaFrTranslation = require('../../dist/app/agenda_fr_translation.json')
const agendaPtTranslation = require('../../dist/app/agenda_pt_translation.json')
const agendaDeTranslation = require('../../dist/app/agenda_de_translation.json')
const agendaArTranslation = require('../../dist/app/agenda_ar_translation.json')
const agendaEsTranslation = require('../../dist/app/agenda_es_translation.json')
const agendaNbNOTranslation = require('../../dist/app/agenda_nb_NO_translation.json')
const collaborativeDocumentEditionEnTranslation = require('../../dist/app/collaborative_document_edition_en_translation.json')
const collaborativeDocumentEditionFrTranslation = require('../../dist/app/collaborative_document_edition_fr_translation.json')
const collaborativeDocumentEditionPtTranslation = require('../../dist/app/collaborative_document_edition_pt_translation.json')
const collaborativeDocumentEditionDeTranslation = require('../../dist/app/collaborative_document_edition_de_translation.json')
const collaborativeDocumentEditionArTranslation = require('../../dist/app/collaborative_document_edition_ar_translation.json')
const collaborativeDocumentEditionEsTranslation = require('../../dist/app/collaborative_document_edition_es_translation.json')
const collaborativeDocumentEditionNbNOTranslation = require('../../dist/app/collaborative_document_edition_nb_NO_translation.json')
const shareFolderEnTranslation = require('../../dist/app/share_folder_en_translation.json')
const shareFolderFrTranslation = require('../../dist/app/share_folder_fr_translation.json')
const shareFolderPtTranslation = require('../../dist/app/share_folder_pt_translation.json')
const shareFolderDeTranslation = require('../../dist/app/share_folder_de_translation.json')
const shareFolderArTranslation = require('../../dist/app/share_folder_ar_translation.json')
const shareFolderEsTranslation = require('../../dist/app/share_folder_es_translation.json')
const shareFolderNbNOTranslation = require('../../dist/app/share_folder_nb_NO_translation.json')
const galleryEnTranslation = require('../../dist/app/gallery_en_translation.json')
const galleryFrTranslation = require('../../dist/app/gallery_fr_translation.json')
const galleryPtTranslation = require('../../dist/app/gallery_pt_translation.json')
const galleryDeTranslation = require('../../dist/app/gallery_de_translation.json')
const galleryArTranslation = require('../../dist/app/gallery_ar_translation.json')
const galleryEsTranslation = require('../../dist/app/gallery_es_translation.json')
const galleryNbNOTranslation = require('../../dist/app/gallery_nb_NO_translation.json')
const kanbanEnTranslation = require('../../dist/app/kanban_en_translation.json')
const kanbanFrTranslation = require('../../dist/app/kanban_fr_translation.json')
const kanbanPtTranslation = require('../../dist/app/kanban_pt_translation.json')
const kanbanDeTranslation = require('../../dist/app/kanban_de_translation.json')
const kanbanArTranslation = require('../../dist/app/kanban_ar_translation.json')
const kanbanEsTranslation = require('../../dist/app/kanban_es_translation.json')
const kanbanNbNOTranslation = require('../../dist/app/kanban_nb_NO_translation.json')

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
          ...shareFolderEnTranslation, // share folder
          ...galleryEnTranslation, // gallery
          ...kanbanEnTranslation // kanban
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
          ...galleryFrTranslation, // gallery
          ...kanbanFrTranslation // kanban
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
          ...galleryPtTranslation, // gallery
          ...kanbanPtTranslation // kanban
        }
      },
      de: {
        translation: {
          ...deTranslation, // frontend_lib
          ...de, // frontend
          ...htmlDocDeTranslation, // html-document
          ...threadDeTranslation, // thread
          ...fileDeTranslation, // file
          ...folderDeTranslation, // folder
          ...wsAdvancedDeTranslation, // advanced workspace
          ...adminWsUserDeTranslation, // admin workspace user
          ...wsDeTranslation, // workspace
          ...agendaDeTranslation, // agenda
          ...collaborativeDocumentEditionDeTranslation,
          ...shareFolderDeTranslation, // share folder
          ...galleryDeTranslation, // gallery
          ...kanbanDeTranslation // kanban
        }
      },
      ar: {
        translation: {
          ...arTranslation, // frontend_lib
          ...ar, // frontend
          ...htmlDocArTranslation, // html-document
          ...threadArTranslation, // thread
          ...fileArTranslation, // file
          ...folderArTranslation, // folder
          ...wsAdvancedArTranslation, // advanced workspace
          ...adminWsUserArTranslation, // admin workspace user
          ...wsArTranslation, // workspace
          ...agendaArTranslation, // agenda
          ...collaborativeDocumentEditionArTranslation,
          ...shareFolderArTranslation, // share folder
          ...galleryArTranslation, // gallery
          ...kanbanArTranslation // kanban
        }
      },
      es: {
        translation: {
          ...esTranslation, // frontend_lib
          ...es, // frontend
          ...htmlDocEsTranslation, // html-document
          ...threadEsTranslation, // thread
          ...fileEsTranslation, // file
          ...folderEsTranslation, // folder
          ...wsAdvancedEsTranslation, // advanced workspace
          ...adminWsUserEsTranslation, // admin workspace user
          ...wsEsTranslation, // workspace
          ...agendaEsTranslation, // agenda
          ...collaborativeDocumentEditionEsTranslation,
          ...shareFolderEsTranslation, // share folder
          ...galleryEsTranslation, // gallery
          ...kanbanEsTranslation // kanban
        }
      },
      nb_NO: {
        translation: {
          ...nbNOTranslation, // frontend_lib
          ...nb_NO, // frontend
          ...htmlDocNbNOTranslation, // html-document
          ...threadNbNOTranslation, // thread
          ...fileNbNOTranslation, // file
          ...folderNbNOTranslation, // folder
          ...wsAdvancedNbNOTranslation, // advanced workspace
          ...adminWsUserNbNOTranslation, // admin workspace user
          ...wsNbNOTranslation, // workspace
          ...agendaNbNOTranslation, // agenda
          ...collaborativeDocumentEditionNbNOTranslation,
          ...shareFolderNbNOTranslation, // share folder
          ...galleryNbNOTranslation, // gallery
          ...kanbanNbNOTranslation // kanban
        }
      }
    }
  })

i18n.tracimId = 'frontend'

export default i18n
