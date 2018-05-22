export const FETCH_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  apiUrl: 'http://localhost:6543/api/v2',
  mockApiUrl: 'http://localhost:3001'
}

export const PAGE = {
  HOME: '/',
  WORKSPACE: {
    DASHBOARD: (idws = ':idws') => `/workspace/${idws}`,
    NEW: '/workspace/new',
    CALENDAR: (idws = ':idws') => `/workspace/${idws}/apps/calendar`,
    CONTENT_LIST: (idws = ':idws') => `/workspace/${idws}/apps/contents`,
    CONTENT: (idws = ':idws', idcts = ':idcts') => `/workspace/${idws}/apps/contents/${idcts}`,
    CONTENT_NEW: (idws = ':idws', ctstype = ':ctstype') => `/workspace/${idws}/apps/contents/${ctstype}/new`,
    CONTENT_EDIT: (idws = ':idws', idcts = ':idcts') => `/workspace/${idws}/apps/contents/${idcts}/edit`,
    CONTENT_TITLE_EDIT: (idws = ':idws', idcts = ':idcts') => `/workspace/${idws}/apps/contents/${idcts}/title/edit`,
    ADMIN: (idws = ':idws') => `/workspace/${idws}/admin`
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
