import { FETCH_CONFIG } from './helper.js'

export const postWorkspace = (user, apiUrl, newWorkspaceName) =>
  fetch(`${apiUrl}/workspaces`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      label: newWorkspaceName,
      description: ''
    })
  })
