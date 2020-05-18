import i18n, { getBrowserLang } from './i18n.js'
import { PROFILE_LIST, ROLE } from 'tracim_frontend_lib'

const configEnv = process.env.NODE_ENV === 'test' ? require('../../configEnv-test.json') : require('../../configEnv.json')

const versionFile = require('../version.json')
export const TRACIM_APP_VERSION = versionFile.tracim_app_version
export const SHARE_FOLDER_ID = -1

export const history = require('history').createBrowserHistory()

// this function is declared in i18n to avoid cyclic imports and reexported here for consistency
export { getBrowserLang }

export const FETCH_CONFIG = {
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  },
  apiUrl: configEnv.apiUrl
}

// Côme - 2018/08/02 - shouldn't this come from api ?
export const workspaceConfig = {
  slug: 'workspace',
  faIcon: 'bank',
  hexcolor: GLOBAL_primaryColor,
  creationLabel: i18n.t('Create a shared space'),
  domContainer: 'appFeatureContainer'
}

export const PAGE = {
  HOME: '/ui',
  WORKSPACE: {
    ROOT: '/ui/workspaces',
    DASHBOARD: (idws = ':idws') => `/ui/workspaces/${idws}/dashboard`,
    NEW: (idws, type) => `/ui/workspaces/${idws}/contents/${type}/new`,
    AGENDA: (idws = ':idws') => `/ui/workspaces/${idws}/agenda`,
    CONTENT_LIST: (idws = ':idws') => `/ui/workspaces/${idws}/contents`,
    CONTENT: (idws = ':idws', type = ':type', idcts = ':idcts') => `/ui/workspaces/${idws}/contents/${type}/${idcts}`,
    SHARE_FOLDER: (idws = ':idws') => `/ui/workspaces/${idws}/contents/share_folder`,
    ADMIN: (idws = ':idws') => `/ui/workspaces/${idws}/admin`,
    CONTENT_EDITION: (idws = ':idws', idcts = ':idcts') => `/ui/online_edition/workspaces/${idws}/contents/${idcts}`,
    GALLERY: (idws = ':idws') => `/ui/workspaces/${idws}/gallery`
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
    USER_EDIT: (userId = ':iduser') => `/ui/admin/user/${userId}`
  },
  SEARCH_RESULT: '/ui/search-result',
  GUEST_UPLOAD: (token = ':token') => `/ui/guest-upload/${token}`,
  GUEST_DOWNLOAD: (token = ':token') => `/ui/guest-download/${token}`
}

export const unLoggedAllowedPageList = [
  PAGE.LOGIN,
  PAGE.FORGOT_PASSWORD,
  PAGE.FORGOT_PASSWORD_NO_EMAIL_NOTIF,
  PAGE.RESET_PASSWORD,
  PAGE.GUEST_UPLOAD(''),
  PAGE.GUEST_DOWNLOAD('')
]

export const findUserRoleIdInWorkspace = (userId, memberList, roleList) => {
  const user = memberList.find(u => u.id === userId) || { role: ROLE.reader.slug }
  return (roleList.find(r => user.role === r.slug) || { id: 1 }).id
}

// INFO - CH - 2019-06-11 - This object must stay synchronized with the slugs of /api/v2/system/content_types
export const CONTENT_TYPE = {
  HTML_DOCUMENT: 'html-document',
  FILE: 'file',
  THREAD: 'thread',
  FOLDER: 'folder',
  COMMENT: 'comment'
}

export const COOKIE_FRONTEND = {
  LAST_CONNECTION: 'lastConnection',
  DEFAULT_LANGUAGE: 'defaultLanguage',
  DEFAULT_EXPIRE_TIME: 180
}

export const getUserProfile = slug => PROFILE_LIST.find(p => slug === p.slug) || {}

const USER_AUTH_INTERNAL = 'internal'
const USER_AUTH_UNKNOWN = 'unknown'
export const editableUserAuthTypeList = [USER_AUTH_INTERNAL, USER_AUTH_UNKNOWN]

export const DRAG_AND_DROP = {
  CONTENT_ITEM: 'contentItem'
}

// Côme - 2018/09/19 - the object bellow is a temporary hack to be able to generate translation keys that only exists in backend
// and are returned through api.
// We will later implement a better solution
// this const isn't exported since it's only purpose is to generate key trads through i18n.scanner
const backendTranslationKeyList = [ // eslint-disable-line no-unused-vars
  i18n.t('Dashboard'),
  i18n.t('All Contents'),
  i18n.t('Opened'),
  i18n.t('Validated'),
  i18n.t('Cancelled'),
  i18n.t('Deprecated')
]

export const ALL_CONTENT_TYPES = 'html-document,file,thread,folder,comment'

export const sortWorkspaceContents = (a, b) => {
  if (a.type === 'folder' && b.type !== 'folder') return -1
  if (b.type === 'folder' && a.type !== 'folder') return 1
  if (a.label > b.label) return 1
  if (b.label > a.label) return -1
  return 0
}
