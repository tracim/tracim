import { FETCH_CONFIG } from './helper.js'

export const postWorkspace = (user, apiUrl, newWorkspaceName) =>
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
