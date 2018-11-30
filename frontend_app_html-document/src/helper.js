import { timelineDebugData } from './timelineDebugData.js'

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

export const debug = {
  config: {
    label: 'Text Document',
    slug: 'html-document',
    faIcon: 'file-text-o',
    hexcolor: '#3f52e3',
    creationLabel: 'Write a document',
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
    lang: 'en',
    avatar_url: 'https://avatars3.githubusercontent.com/u/11177014?s=460&v=4',
    idRoleUserWorkspace: 8
  },
  content: {
    author: {
      avatar_url: null,
      public_name: 'Global manager',
      user_id: 1 // -1 or 1 for debug
    },
    content_id: 11,
    content_type: 'html-document',
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
    workspace_id: 1
  },
  timeline: timelineDebugData
}
