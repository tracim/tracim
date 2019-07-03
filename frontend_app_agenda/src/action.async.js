import { FETCH_CONFIG } from './helper.js'

export const getAgendaList = (apiUrl, workspaceId = null) => {
  const href = workspaceId
    ? `users/me/agenda?workspace_ids=${workspaceId}`
    : 'users/me/agenda'

  return fetch(`${apiUrl}/${href}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })
}

export const getWorkspaceDetail = (apiUrl, workspaceId) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })
}

export const getWorkspaceMemberList = (apiUrl, workspaceId) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}/members`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })
}
