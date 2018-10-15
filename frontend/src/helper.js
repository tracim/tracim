import i18n from './i18n.js'

const configEnv = require('../configEnv.json')

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
  HOME: '/',
  WORKSPACE: {
    ROOT: '/workspaces',
    DASHBOARD: (idws = ':idws') => `/workspaces/${idws}/dashboard`,
    NEW: (idws, type) => `/workspaces/${idws}/contents/${type}/new`,
    CALENDAR: (idws = ':idws') => `/workspaces/${idws}/calendar`,
    CONTENT_LIST: (idws = ':idws') => `/workspaces/${idws}/contents`,
    CONTENT: (idws = ':idws', type = ':type', idcts = ':idcts') => `/workspaces/${idws}/contents/${type}/${idcts}`,
    ADMIN: (idws = ':idws') => `/workspaces/${idws}/admin`
  },
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ACCOUNT: '/account',
  ADMIN: {
    ROOT: '/admin',
    WORKSPACE: '/admin/workspace',
    USER: '/admin/user',
    USER_EDIT: (idUser = ':iduser') => `/admin/user/${idUser}`
  }
}

export const unLoggedAllowedPageList = [PAGE.LOGIN, PAGE.FORGOT_PASSWORD, PAGE.RESET_PASSWORD]

export const ROLE = [{
  id: 8,
  slug: 'workspace-manager',
  faIcon: 'gavel',
  hexcolor: '#ed0007',
  label: i18n.t('Shared space manager')
}, {
  id: 4,
  slug: 'content-manager',
  faIcon: 'graduation-cap',
  hexcolor: '#f2af2d',
  label: i18n.t('Content manager')
}, {
  id: 2,
  slug: 'contributor',
  faIcon: 'pencil',
  hexcolor: '#3145f7',
  label: i18n.t('Contributor')
}, {
  id: 1,
  slug: 'reader',
  faIcon: 'eye',
  hexcolor: '#15d948',
  label: i18n.t('Reader')
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
    label: i18n.t('Reader')
  },
  contributor: {
    id: 2,
    slug: 'contributor',
    faIcon: 'pencil',
    hexcolor: '#3145f7',
    label: i18n.t('Contributor')
  },
  contentManager: {
    id: 4,
    slug: 'content-manager',
    faIcon: 'graduation-cap',
    hexcolor: '#f2af2d',
    label: i18n.t('Content manager')
  },
  workspaceManager: {
    id: 8,
    slug: 'workspace-manager',
    faIcon: 'gavel',
    hexcolor: '#ed0007',
    label: i18n.t('Shared space manager')
  }
}

export const PROFILE = {
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

export const getUserProfile = slug => Object.keys(PROFILE).map(p => PROFILE[p]).find(p => slug === p.slug) || {}

export const handleRouteFromApi = route => route.startsWith('/#') ? route.slice(2) : route

// Côme - 2018/09/19 - the object bellow is a temporary hack to be able to generate translation keys that only exists in backend
// and are returned through api.
// We will later implement a better solution
// this const isn't exported since it's only purpose is to generate key trads through i18n.scanner
const translationKeyFromBackend = [
  i18n.t('Dashboard'),
  i18n.t('All Contents'),
  i18n.t('Open'),
  i18n.t('Validated'),
  i18n.t('Cancelled'),
  i18n.t('Deprecated')
]
