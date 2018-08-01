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

export const PAGE = {
  HOME: '/',
  WORKSPACE: {
    DASHBOARD: (idws = ':idws') => `/workspaces/${idws}/dashboard`,
    NEW: (idws, type) => `/workspaces/${idws}/${type}/new`,
    CALENDAR: (idws = ':idws') => `/workspaces/${idws}/calendar`,
    CONTENT_LIST: (idws = ':idws') => `/workspaces/${idws}/contents`,
    CONTENT: (idws = ':idws', type = ':type?', idcts = ':idcts?') => `/workspaces/${idws}/${type}/${idcts}`, // @TODO add /contents/ in url and remove <Switch> in <Tracim>
    // CONTENT_NEW: (idws = ':idws', ctstype = ':ctstype') => `/workspaces/${idws}/contents/${ctstype}/new`,
    // CONTENT_EDIT: (idws = ':idws', idcts = ':idcts') => `/workspaces/${idws}/contents/${idcts}/edit`,
    // CONTENT_TITLE_EDIT: (idws = ':idws', idcts = ':idcts') => `/workspaces/${idws}/contents/${idcts}/title/edit`,
    ADMIN: (idws = ':idws') => `/workspaces/${idws}/admin`
  },
  LOGIN: '/login',
  ACCOUNT: '/account',
  ADMIN: {
    ROOT: '/admin',
    WORKSPACE: '/admin/workspace',
    USEr: '/admin/user'
  }
}

export const ROLE = [{
  id: 0,
  name: 'reader',
  icon: 'fa-eye',
  translationKey: 'role.reader'
}, {
  id: 1,
  name: 'contributor',
  icon: 'fa-pencil',
  translationKey: 'role.contributor'
}, {
  id: 2,
  name: 'content_manager',
  icon: 'fa-graduation-cap',
  translationKey: 'role.content_manager'
}, {
  id: 3,
  name: 'manager',
  icon: 'fa-gavel',
  translationKey: 'role.manager'
}]

export const handleRouteFromApi = route => route.startsWith('/#') ? route.slice(2) : route
