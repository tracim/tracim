import { FETCH_CONFIG } from './helper.js'

export const getWorkspaceList = (user, apiUrl) =>
  fetch(`${apiUrl}/workspaces`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })
