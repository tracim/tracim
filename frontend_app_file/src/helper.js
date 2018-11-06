import { timelineDebugData } from './timelineDebugData.js'
import i18n from './i18n.js'

export const FETCH_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
}

export const MODE = {
  VIEW: 'view',
  EDIT: 'edit',
  REVISION: 'revision'
}

export const removeExtensionOfFilename = filename => filename.split('.').splice(0, (filename.split('.').length - 1)).join('.')

export const displayFileSize = (bytes, decimals) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals <= 0 ? 0 : decimals || 2
  const sizes = [i18n.t('Bytes'), i18n.t('KB'), i18n.t('MB'), i18n.t('GB'), i18n.t('TB'), i18n.t('PB'), i18n.t('EB'), i18n.t('ZB'), i18n.t('YB')]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export const debug = {
  config: {
    slug: 'file',
    faIcon: 'paperclip',
    hexcolor: '#ff9900',
    creationLabel: 'Upload a file',
    domContainer: 'appFeatureContainer',
    apiUrl: 'http://192.168.1.153:6543/api/v2',
    availableStatuses: [{
      label: 'Open',
      slug: 'open',
      faIcon: 'square-o',
      hexcolor: '#3f52e3',
      globalStatus: 'open'
    }, {
      label: 'Validated',
      slug: 'closed-validated',
      faIcon: 'check-square-o',
      hexcolor: '#008000',
      globalStatus: 'closed'
    }, {
      label: 'Cancelled',
      slug: 'closed-unvalidated',
      faIcon: 'close',
      hexcolor: '#f63434',
      globalStatus: 'closed'
    }, {
      label: 'Deprecated',
      slug: 'closed-deprecated',
      faIcon: 'warning',
      hexcolor: '#ababab',
      globalStatus: 'closed'
    }],
    translation: {
      en: {
        translation: {
          'Last version': 'Last version debug en'
        }
      },
      fr: {
        translation: {
          'Last version': 'Dernière version debug fr'
        }
      }
    }
  },
  loggedUser: { // @FIXME this object is outdated
    user_id: 1,
    username: 'Smoi',
    firstname: 'Côme',
    lastname: 'Stoilenom',
    email: 'osef@algoo.fr',
    lang: 'fr',
    avatar_url: 'https://avatars3.githubusercontent.com/u/11177014?s=460&v=4',
    idRoleUserWorkspace: 8
  },
  content: {
    author: {
      avatar_url: null,
      public_name: 'Global manager',
      user_id: 1 // -1 or 1 for debug
    },
    content_id: 1,
    content_type: 'file',
    created: '2018-06-18T14:59:26Z',
    current_revision_id: 11,
    is_archived: false,
    is_deleted: false,
    label: 'Current Menu',
    last_modifier: {
      avatar_url: null,
      public_name: 'Global manager',
      user_id: 1
    },
    modified: '2018-06-18T14:59:26Z',
    parent_id: 2,
    raw_content: '<div>bonjour, je suis un lapin.</div>',
    show_in_ui: true,
    slug: 'current-menu',
    status: 'open',
    sub_content_types: ['thread', 'html-document', 'file', 'folder'],
    workspace_id: 1,
    contentFull: null,
    page_nb: 1
  },
  timeline: timelineDebugData,
  idWorkspace: 1
}
