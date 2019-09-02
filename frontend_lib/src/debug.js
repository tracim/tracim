import i18n from './i18n.js'
import { FETCH_CONFIG } from './helper.js'

const ROLE = [{
  id: 8,
  slug: 'workspace-manager',
  faIcon: 'gavel',
  hexcolor: '#ed0007',
  tradKey: i18n.t('Shared space manager'), // trad key allow the parser to generate an entry in the json file
  label: 'Shared space manager' // label must be used in components
}, {
  id: 4,
  slug: 'content-manager',
  faIcon: 'graduation-cap',
  hexcolor: '#f2af2d',
  tradKey: i18n.t('Content manager'), // trad key allow the parser to generate an entry in the json file
  label: 'Content manager' // label must be used in components
}, {
  id: 2,
  slug: 'contributor',
  faIcon: 'pencil',
  hexcolor: '#3145f7',
  tradKey: i18n.t('Contributor'), // trad key allow the parser to generate an entry in the json file
  label: 'Contributor' // label must be used in components
}, {
  id: 1,
  slug: 'reader',
  faIcon: 'eye',
  hexcolor: '#15d948',
  tradKey: i18n.t('Reader'), // trad key allow the parser to generate an entry in the json file
  label: 'Reader' // label must be used in components
}]

const PROFILE = {
  ADMINISTRATOR: {
    id: 1,
    slug: 'administrators',
    faIcon: 'shield',
    hexcolor: '#ed0007',
    label: i18n.t('Administrator')
  },
  MANAGER: {
    id: 2,
    slug: 'trusted-users',
    faIcon: 'graduation-cap',
    hexcolor: '#f2af2d',
    label: i18n.t('Trusted user')
  },
  USER: {
    id: 4,
    slug: 'users',
    faIcon: 'user',
    hexcolor: '#3145f7',
    label: i18n.t('User')
  }
}

const STATUSES = [{
  label: 'Opened',
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
}]

const SYSTEM_CONFIG = {
  appListLoaded: true,
  config: {
    email_notification_activated: false,
    new_user_invitation_do_notify: true,
    search_enabled: true,
    webdav_enabled: true,
    webdav_url: 'http://localhost:3030/'
  },
  contentTypeListLoaded: true,
  redirectLogin: '',
  workspaceListLoaded: true
}

const DOM_CONTAINER = 'appFeatureContainer'

export const defaultDebug = {
  config: {
    apiHeader: FETCH_CONFIG.headers,
    apiUrl: '',
    availableStatuses: STATUSES,
    profileObject: PROFILE,
    roleList: ROLE,
    system: SYSTEM_CONFIG,
    domContainer: DOM_CONTAINER,
    slug: '',
    faIcon: '',
    hexcolor: '',
    creationLabel: '',
    translation: {
      en: {
        translation: {
        }
      },
      fr: {
        translation: {
        }
      }
    },
    label: ''
  },
  content: {
    content_id: 0,
    content_type: '',
    workspace_id: 0
  },
  loggedUser: {
    agendaUrl: '',
    auth_type: 'internal',
    user_id: 1,
    public_name: 'Global manager',
    email: 'osef@algoo.fr',
    lang: 'fr',
    avatar_url: null,
    idRoleUserWorkspace: 8,
    created: '2019-06-03T14:28:14Z',
    is_active: true,
    is_deleted: false,
    logged: true,
    profile: 'administrators',
    timezone: ''
  }
}
