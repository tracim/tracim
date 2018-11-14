import i18n, { getBrowserLang } from './i18n.js'

const configEnv = require('../configEnv.json')

// this function is declared in i18n to avoid cyclic imports and reexported here for consistency
export { getBrowserLang }

export const FETCH_CONFIG = {
  headers: {
    'Accept': 'application/json',
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
    CALENDAR: (idws = ':idws') => `/ui/workspaces/${idws}/calendar`,
    CONTENT_LIST: (idws = ':idws') => `/ui/workspaces/${idws}/contents`,
    CONTENT: (idws = ':idws', type = ':type', idcts = ':idcts') => `/ui/workspaces/${idws}/contents/${type}/${idcts}`,
    ADMIN: (idws = ':idws') => `/ui/workspaces/${idws}/admin`
  },
  LOGIN: '/ui/login',
  FORGOT_PASSWORD: '/ui/forgot-password',
  RESET_PASSWORD: '/ui/reset-password',
  ACCOUNT: '/ui/account',
  ADMIN: {
    ROOT: '/ui/admin',
    WORKSPACE: '/ui/admin/workspace',
    USER: '/ui/admin/user',
    USER_EDIT: (idUser = ':iduser') => `/ui/admin/user/${idUser}`
  }
}

export const unLoggedAllowedPageList = [PAGE.LOGIN, PAGE.FORGOT_PASSWORD, PAGE.RESET_PASSWORD]

export const ROLE = [{
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

export const findIdRoleUserWorkspace = (idUser, memberList, roleList) => {
  const myself = memberList.find(u => u.id === idUser) || {role: 'reader'}
  return (roleList.find(r => myself.role === r.slug) || {id: 1}).id
}

// Côme - 2018/08/21 - useful ?
export const ROLE2 = {
  reader: {
    id: 1,
    sluf: 'reader',
    faIcon: 'eye',
    hexcolor: '#15D948',
    tradKey: i18n.t('Reader'), // trad key allow the parser to generate an entry in the json file
    label: 'Reader' // label must be used in components
  },
  contributor: {
    id: 2,
    slug: 'contributor',
    faIcon: 'pencil',
    hexcolor: '#3145f7',
    tradKey: i18n.t('Contributor'), // trad key allow the parser to generate an entry in the json file
    label: 'Contributor' // label must be used in components
  },
  contentManager: {
    id: 4,
    slug: 'content-manager',
    faIcon: 'graduation-cap',
    hexcolor: '#f2af2d',
    tradKey: i18n.t('Content manager'), // trad key allow the parser to generate an entry in the json file
    label: 'Content manager' // label must be used in components
  },
  workspaceManager: {
    id: 8,
    slug: 'workspace-manager',
    faIcon: 'gavel',
    hexcolor: '#ed0007',
    tradKey: i18n.t('Shared space manager'), // trad key allow the parser to generate an entry in the json file
    label: 'Shared space manager' // label must be used in components
  }
}

export const PROFILE = {
  ADMINISTRATOR: {
    id: 1,
    slug: 'administrators',
    faIcon: 'shield',
    hexcolor: '#ed0007',
    tradKey: i18n.t('Administrator'), // trad key allow the parser to generate an entry in the json file
    label: 'Administrator' // label must be used in components
  },
  MANAGER: {
    id: 2,
    slug: 'trusted-users',
    faIcon: 'graduation-cap',
    hexcolor: '#f2af2d',
    tradKey: i18n.t('Trusted user'), // trad key allow the parser to generate an entry in the json file
    label: 'Trusted user' // label must be used in components
  },
  USER: {
    id: 4,
    slug: 'users',
    faIcon: 'user',
    hexcolor: '#3145f7',
    tradKey: i18n.t('User'), // trad key allow the parser to generate an entry in the json file
    label: 'User' // label must be used in components
  }
}

export const getUserProfile = slug => Object.keys(PROFILE).map(p => PROFILE[p]).find(p => slug === p.slug) || {}

// Côme - 2018/09/19 - the object bellow is a temporary hack to be able to generate translation keys that only exists in backend
// and are returned through api.
// We will later implement a better solution
// this const isn't exported since it's only purpose is to generate key trads through i18n.scanner
const translationKeyFromBackend = [ // eslint-disable-line no-unused-vars
  i18n.t('Dashboard'),
  i18n.t('All Contents'),
  i18n.t('Open'),
  i18n.t('Validated'),
  i18n.t('Cancelled'),
  i18n.t('Deprecated'),
  i18n.t('text document'),
  i18n.t('text documents'),
  i18n.t('thread'),
  i18n.t('threads'),
  i18n.t('file'),
  i18n.t('files')
]
