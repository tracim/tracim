import dateFnsFr from 'date-fns/locale/fr'
import dateFnsEn from 'date-fns/locale/en-US'
import dateFnsPt from 'date-fns/locale/pt'
import dateFnsDe from 'date-fns/locale/de'
import dateFnsAr from 'date-fns/locale/ar-SA'
import dateFnsEs from 'date-fns/locale/es'
import dateFnsNbNO from 'date-fns/locale/nb'
import i18n from './i18n.js'

export const PAGE = {
  CONTENT: (idcts = ':idcts') => `/ui/contents/${idcts}`,
  HOME: '/ui',
  WORKSPACE: {
    ADVANCED_DASHBOARD: (idws = ':idws') => `/ui/workspaces/${idws}/advanced_dashboard`,
    ROOT: '/ui/workspaces',
    DASHBOARD: (idws = ':idws') => `/ui/workspaces/${idws}/dashboard`,
    NEW: (idws, type) => `/ui/workspaces/${idws}/contents/${type}/new`,
    AGENDA: (idws = ':idws') => `/ui/workspaces/${idws}/agenda`,
    CONTENT_LIST: (idws = ':idws') => `/ui/workspaces/${idws}/contents`,
    CONTENT: (idws = ':idws', type = ':type', idcts = ':idcts') => `/ui/workspaces/${idws}/contents/${type}/${idcts}`,
    SHARE_FOLDER: (idws = ':idws') => `/ui/workspaces/${idws}/contents/share_folder`,
    ADMIN: (idws = ':idws') => `/ui/workspaces/${idws}/admin`,
    CONTENT_EDITION: (idws = ':idws', idcts = ':idcts') => `/ui/online_edition/workspaces/${idws}/contents/${idcts}`,
    GALLERY: (idws = ':idws') => `/ui/workspaces/${idws}/gallery`,
    RECENT_ACTIVITIES: (idws = ':idws') => `/ui/workspaces/${idws}/recent-activities`,
    PUBLICATION: (idws = ':idws', idcts = ':idcts') => `/ui/workspaces/${idws}/publications/${idcts}`,
    PUBLICATIONS: (idws = ':idws') => `/ui/workspaces/${idws}/publications`,
    FOLDER_OPEN: (idws = ':idws', folderList) => `/ui/workspaces/${idws}/contents?folder_open=${folderList.toString()}`
  },
  LOGIN: '/ui/login',
  FORGOT_PASSWORD: '/ui/forgot-password',
  FORGOT_PASSWORD_NO_EMAIL_NOTIF: '/ui/forgot-password-no-email-notif',
  RESET_PASSWORD: '/ui/reset-password',
  ACCOUNT: '/ui/account',
  AGENDA: '/ui/agenda',
  ADMIN: {
    ROOT: '/ui/admin',
    WORKSPACE: '/ui/admin/workspace',
    USER: '/ui/admin/user',
    USER_EDIT: (userId = ':iduser') => `/ui/admin/user/${userId}`,
    USER_SPACE_LIST: (userId = ':iduser') => `/ui/admin/user/${userId}/spaces`
  },
  SEARCH_RESULT: '/ui/search-result',
  GUEST_UPLOAD: (token = ':token') => `/ui/guest-upload/${token}`,
  GUEST_DOWNLOAD: (token = ':token') => `/ui/guest-download/${token}`,
  JOIN_WORKSPACE: '/ui/join-workspace',
  RECENT_ACTIVITIES: '/ui/recent-activities',
  ONLINE_EDITION: (contentId) => `/api/collaborative-document-edition/wopi/files/${contentId}`,
  PUBLIC_PROFILE: (userId = ':userid') => `/ui/users/${userId}/profile`,
  FAVORITES: '/ui/favorites',
  TODO: '/ui/todos'
}

export const DATE_FNS_LOCALE = {
  fr: dateFnsFr,
  en: dateFnsEn,
  pt: dateFnsPt,
  de: dateFnsDe,
  ar: dateFnsAr,
  es: dateFnsEs,
  nb_NO: dateFnsNbNO
}

// INFO - MP - 2022-06-09 - This array must stay synchronized with the supported extensions
export const COLLABORA_EXTENSIONS = [
  '.odg',
  '.odp',
  '.ods',
  '.odt'
]

export const BREADCRUMBS_TYPE = {
  CORE: 'CORE',
  APP_FULLSCREEN: 'APP_FULLSCREEN',
  APP_FEATURE: 'APP_FEATURE'
}

export const revisionTypeList = [{
  id: 'archiving',
  faIcon: 'fas fa-archive',
  tradKey: i18n.t('Item archived'),
  label: 'Item archived'
}, {
  id: 'content-comment',
  faIcon: 'far fa-comment',
  tradKey: i18n.t('Comment'),
  label: 'Comment'
}, {
  id: 'creation',
  faIcon: 'fas fa-magic',
  tradKey: i18n.t('Item created'),
  label: 'Item created'
}, {
  id: 'deletion',
  faIcon: 'far fa-trash-alt',
  tradKey: i18n.t('Item deleted'),
  label: 'Item deleted'
}, {
  id: 'edition',
  faIcon: 'fas fa-history',
  tradKey: i18n.t('New revision'),
  label: 'New revision'
}, {
  id: 'revision',
  faIcon: 'fas fa-history',
  tradKey: i18n.t('New revision'),
  label: 'New revision'
}, {
  id: 'status-update',
  faIcon: 'fas fa-random',
  label: (statusLabel) => i18n.t('Status changed to {{status}}', { status: statusLabel })
}, {
  id: 'unarchiving',
  faIcon: 'far fa-file-archive',
  tradKey: i18n.t('Item unarchived'),
  label: 'Item unarchived'
}, {
  id: 'undeletion',
  faIcon: 'fas fa-trash-restore',
  tradKey: i18n.t('Item restored'),
  label: 'Item restored'
}, {
  id: 'move',
  faIcon: 'fas fa-arrows-alt',
  tradKey: i18n.t('Item moved'),
  label: 'Item moved'
}, {
  id: 'copy',
  faIcon: 'far fa-copy',
  tradKey: i18n.t('Item copied'),
  label: 'Item copied'
}, {
  id: 'mark-as-template',
  faIcon: 'fas fa-clipboard',
  tradKey: i18n.t('Item marked as template'),
  label: 'Item marked as template'
}, {
  id: 'unmark-as-template',
  faIcon: 'fas fa-paste',
  tradKey: i18n.t('Item unmarked as template'),
  label: 'Item unmarked as template'
}]

const WORKSPACE_MANAGER = {
  id: 8,
  slug: 'workspace-manager',
  faIcon: 'fas fa-gavel',
  hexcolor: '#ed0007',
  tradKey: [
    i18n.t('Space manager'),
    i18n.t('Content manager + add members and edit spaces')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'Space manager', // label must be used in components
  description: 'Content manager + add members and edit spaces'
}
const CONTENT_MANAGER = {
  id: 4,
  slug: 'content-manager',
  faIcon: 'fas fa-graduation-cap',
  hexcolor: '#f2af2d',
  tradKey: [
    i18n.t('Content manager'),
    i18n.t('Contributor + create folders and manage contents')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'Content manager', // label must be used in components
  description: 'Contributor + create folders and manage contents'
}
const CONTRIBUTOR = {
  id: 2,
  slug: 'contributor',
  faIcon: 'fas fa-pencil-alt',
  hexcolor: '#3145f7',
  tradKey: [
    i18n.t('Contributor'),
    i18n.t('Reader + create/modify content')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'Contributor', // label must be used in components
  description: 'Reader + create/modify content'
}
const READER = {
  id: 1,
  slug: 'reader',
  faIcon: 'far fa-eye',
  hexcolor: '#15d948',
  tradKey: [
    i18n.t('Reader'),
    i18n.t('Read contents')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'Reader', // label must be used in components
  description: 'Read contents'
}
export const ROLE = {
  workspaceManager: WORKSPACE_MANAGER,
  contentManager: CONTENT_MANAGER,
  contributor: CONTRIBUTOR,
  reader: READER
}
export const ROLE_LIST = [WORKSPACE_MANAGER, CONTENT_MANAGER, CONTRIBUTOR, READER]

const ADMINISTRATOR = {
  id: 3,
  slug: 'administrators',
  faIcon: 'fas fa-shield-alt',
  hexcolor: '#ed0007',
  tradKey: [
    i18n.t('Administrator'),
    i18n.t('Trusted user + create users, administration of instance')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'Administrator', // label must be used in components
  description: 'Trusted user + create users, administration of instance'
}
const MANAGER = {
  id: 2,
  slug: 'trusted-users',
  faIcon: 'fas fa-graduation-cap',
  hexcolor: '#f2af2d',
  tradKey: [
    i18n.t('Trusted user'),
    i18n.t('User + create spaces, add members in spaces')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'Trusted user', // label must be used in components
  description: 'User + create spaces, add members in spaces'
}
const USER = {
  id: 1,
  slug: 'users',
  faIcon: 'fas fa-user',
  hexcolor: '#3145f7',
  tradKey: [
    i18n.t('User'),
    i18n.t('Access to spaces where user is member')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'User', // label must be used in components
  description: 'Access to spaces where user is member'
}
export const PROFILE = {
  administrator: ADMINISTRATOR,
  manager: MANAGER,
  user: USER
}
export const PROFILE_LIST = [ADMINISTRATOR, MANAGER, USER]

const OPEN = {
  id: 2,
  slug: 'open',
  faIcon: 'far fa-sun',
  tradKey: [
    i18n.t('Open'),
    i18n.t('Any user will be able to see, join and open this space.')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'Open',
  description: 'Any user will be able to see, join and open this space.'
}
const ON_REQUEST = {
  id: 3,
  slug: 'on_request',
  faIcon: 'far fa-handshake',
  tradKey: [
    i18n.t('On request'),
    i18n.t('Any user will be able to see and send a request to join this space, the space managers will be able to accept/reject requests.')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'On request',
  description: 'Any user will be able to see and send a request to join this space, the space managers will be able to accept/reject requests.'
}
const CONFIDENTIAL = {
  id: 4,
  hexcolor: '#B61616',
  slug: 'confidential',
  faIcon: 'fas fa-user-secret',
  tradKey: [
    i18n.t('Confidential'),
    i18n.t('Only invited users will be able to see and open this space, invitation is sent by space managers.')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'Confidential',
  description: 'Only invited users will be able to see and open this space, invitation is sent by space managers.'
}
export const SPACE_TYPE = {
  open: OPEN,
  onRequest: ON_REQUEST,
  confidential: CONFIDENTIAL
}

// INFO - GB - 2020-11-04 - The order of types in SPACE_TYPE_LIST is important to PopupCreateWorkspace.jsx. CONFIDENTIAL needs to be first.
export const SPACE_TYPE_LIST = [CONFIDENTIAL, ON_REQUEST, OPEN]
export const ACCESSIBLE_SPACE_TYPE_LIST = [OPEN, ON_REQUEST]

const SUBSCRIPTION_PENDING = {
  id: 1,
  slug: 'pending',
  faIcon: 'fas fa-sign-in-alt',
  tradKey: [
    i18n.t('pending')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'pending'
}
const SUBSCRIPTION_REJECTED = {
  id: 2,
  slug: 'rejected',
  faIcon: 'fas fa-times',
  tradKey: [
    i18n.t('rejected')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'rejected'
}
const SUBSCRIPTION_ACCEPTED = {
  id: 3,
  slug: 'accepted',
  faIcon: 'fas fa-check',
  tradKey: [
    i18n.t('accepted')
  ], // trad key allow the parser to generate an entry in the json file
  label: 'accepted'
}
export const SUBSCRIPTION_TYPE = {
  pending: SUBSCRIPTION_PENDING,
  rejected: SUBSCRIPTION_REJECTED,
  accepted: SUBSCRIPTION_ACCEPTED
}
export const SUBSCRIPTION_TYPE_LIST = [SUBSCRIPTION_PENDING, SUBSCRIPTION_REJECTED, SUBSCRIPTION_ACCEPTED]

export const APP_FEATURE_MODE = {
  VIEW: 'view',
  EDIT: 'edit',
  REVISION: 'revision'
}

export const IMG_LOAD_STATE = {
  LOADED: 'loaded',
  LOADING: 'loading',
  ERROR: 'error'
}

export const STATUSES = {
  OPEN: 'open',
  VALIDATED: 'closed-validated',
  CANCELLED: 'closed-unvalidated',
  DEPRECATED: 'closed-deprecated'
}

// INFO - CH - 2019-06-11 - This object must stay synchronized with the slugs of /api/system/content_types
export const CONTENT_TYPE = {
  HTML_DOCUMENT: 'html-document',
  FILE: 'file',
  THREAD: 'thread',
  FOLDER: 'folder',
  COMMENT: 'comment',
  KANBAN: 'kanban',
  TODO: 'todo',
  LOGBOOK: 'logbook'
}

export const CONTENT_NAMESPACE = {
  CONTENT: 'content',
  UPLOAD: 'upload',
  PUBLICATION: 'publication'
}

export const TIMELINE_TYPE = {
  COMMENT: CONTENT_TYPE.COMMENT,
  COMMENT_AS_FILE: `${CONTENT_TYPE.COMMENT}AsFile`,
  REVISION: 'revision',
  REVISION_GROUP: 'revisionGroup'
}

export const FILE_PREVIEW_STATE = {
  NO_PREVIEW: 'noPreview',
  NO_FILE: 'noFile'
}

export const MINIMUM_CHARACTERS_USERNAME = 3
export const MAXIMUM_CHARACTERS_USERNAME = 255
export const ALLOWED_CHARACTERS_USERNAME = 'azAZ09-_.'
export const CHECK_USERNAME_DEBOUNCE_WAIT = 250

export const NUMBER_RESULTS_BY_PAGE = 15

export const USER_CALL_STATE = {
  IN_PROGRESS: 'in_progress',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  DECLINED: 'declined',
  CANCELLED: 'cancelled',
  UNANSWERED: 'unanswered'
}

export const USERNAME_ALLOWED_CHARACTERS_REGEX = /[a-zA-Z0-9\-_]/
