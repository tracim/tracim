import { FETCH_CONFIG } from 'tracim_frontend_lib'

export const getAgendaList = (apiUrl, idWorkspace = null) => {
  const href = idWorkspace
    ? `users/me/agenda?workspace_ids=${idWorkspace}`
    : 'users/me/agenda'

  return fetch(`${apiUrl}/${href}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })
}

export const getWorkspaceDetail = (apiUrl, idWorkspace) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })
}

export const getWorkspaceMemberList = (apiUrl, idWorkspace) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/members`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })
}
