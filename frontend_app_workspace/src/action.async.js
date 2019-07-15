import { FETCH_CONFIG } from 'tracim_frontend_lib'

export const postWorkspace = (apiUrl, newWorkspaceName) =>
  fetch(`${apiUrl}/workspaces`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      label: newWorkspaceName,
      description: ''
    })
  })
