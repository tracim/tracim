import { defaultDebug } from 'tracim_frontend_lib'

const FETCH_CONFIG = defaultDebug.fetchConfig

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
