export const FETCH_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  apiUrl: 'http://localhost:6543/api/v2',
  mockApiUrl: 'http://localhost:3001'
}

export const PAGE_NAME = {
  HOME: '/',
  WS_CONTENT: '/workspace',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
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
