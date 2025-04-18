import { FETCH_CONFIG } from './helper.js'

import {
  ROLE,
  ROLE_LIST,
  PROFILE
} from './constant.js'

const STATUSES = [{
  label: 'Opened',
  slug: 'open',
  faIcon: 'far fa-square',
  hexcolor: '#3f52e3',
  globalStatus: 'open'
}, {
  label: 'Validated',
  slug: 'closed-validated',
  faIcon: 'far fa-check-square',
  hexcolor: '#008000',
  globalStatus: 'closed'
}, {
  label: 'Cancelled',
  slug: 'closed-unvalidated',
  faIcon: 'fas fa-times',
  hexcolor: '#f63434',
  globalStatus: 'closed'
}, {
  label: 'Deprecated',
  slug: 'closed-deprecated',
  faIcon: 'fas fa-exclamation-triangle',
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
    webdav_url: 'http://localhost:3030/',
    apiUrl: '/api',
    ui__notes__code_sample_languages: []
  },
  contentTypeListLoaded: true,
  redirectLogin: '',
  workspaceListLoaded: true
}

const DOM_CONTAINER = 'appFeatureContainer'

export const defaultDebug = {
  config: {
    apiHeader: FETCH_CONFIG.headers,
    apiUrl: '/api',
    availableStatuses: STATUSES,
    profileObject: PROFILE,
    roleList: ROLE_LIST,
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
    label: '',
    appCustomActionList: []
  },
  content: {
    content_id: 0,
    content_type: '',
    workspace_id: 0
  },
  loggedUser: {
    agendaUrl: '',
    authType: 'internal',
    config: {},
    userId: 1,
    publicName: 'Global manager',
    username: 'global_manager',
    email: 'osef@algoo.fr',
    lang: 'en',
    avatarUrl: null,
    userRoleIdInWorkspace: ROLE.workspaceManager.id,
    created: '2019-06-03T14:28:14Z',
    isActive: true,
    logged: true,
    profile: PROFILE.administrator.slug,
    timezone: ''
  }
}
