export const FETCH_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + btoa(`${'admin@admin.admin'}:${'admin@admin.admin'}`)
  },
  apiUrl: 'http://localhost:6543/api/v2',
  mockApiUrl: 'http://localhost:3001'
}

export const PAGE = {
  HOME: '/',
  WORKSPACE: {
    DASHBOARD: (idws = ':idws') => `/workspaces/${idws}/dashboard`,
    NEW: '/workspaces/new',
    CALENDAR: (idws = ':idws') => `/workspaces/${idws}/calendar`,
    CONTENT_LIST: (idws = ':idws') => `/workspaces/${idws}/contents`,
    CONTENT: (idws = ':idws', type = ':type?', idcts = ':idcts?') => `/workspaces/${idws}/${type}/${idcts}`,
    CONTENT_NEW: (idws = ':idws', ctstype = ':ctstype') => `/workspaces/${idws}/contents/${ctstype}/new`,
    CONTENT_EDIT: (idws = ':idws', idcts = ':idcts') => `/workspaces/${idws}/contents/${idcts}/edit`,
    CONTENT_TITLE_EDIT: (idws = ':idws', idcts = ':idcts') => `/workspaces/${idws}/contents/${idcts}/title/edit`,
    ADMIN: (idws = ':idws') => `/workspaces/${idws}/admin`
  },
  LOGIN: '/login',
  ACCOUNT: '/account'
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
