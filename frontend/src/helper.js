export const FETCH_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  apiUrl: 'http://localhost:6543/api/v2',
  mockApiUrl: 'http://localhost:3001' // @todo: better to use one url only and use proxy on mock api to point to real api (if implemented)
}

export const COOKIE = {
  USER_LOGIN: 'user_login',
  USER_AUTH: 'user_auth'
}

// Côme - 2018/08/02 - shouldn't this come from api ?
export const workspaceConfig = {
  slug: 'workspace',
  faIcon: 'space-shuttle',
  hexcolor: '#7d4e24',
  creationLabel: 'Create a workspace',
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
  ACCOUNT: '/account',
  ADMIN: {
    ROOT: '/admin',
    WORKSPACE: '/admin/workspace',
    USER: '/admin/user'
  }
}

export const ROLE = [{
  id: 0,
  slug: 'reader',
  faIcon: 'eye',
  hexcolor: '#15D948',
  label: 'Reader'
}, {
  id: 1,
  slug: 'contributor',
  faIcon: 'pencil',
  hexcolor: '#3145F7',
  label: 'Contributor'
}, {
  id: 2,
  slug: 'content-manager',
  faIcon: 'graduation-cap',
  hexcolor: '#f2af2d',
  label: 'Content manager'
}, {
  id: 3,
  slug: 'workspace-manager',
  faIcon: 'gavel',
  hexcolor: '#ed0007',
  label: 'Workspace manager'
}]

export const PROFILE = {
  ADMINISTRATOR: 'administrators',
  USER: 'users'
}

export const handleRouteFromApi = route => route.startsWith('/#') ? route.slice(2) : route
