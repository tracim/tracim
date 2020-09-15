import { baseFetch } from 'tracim_frontend_lib'

export const postWorkspace = (apiUrl, newWorkspaceName) =>
  baseFetch('POST', `${apiUrl}/workspaces`, {
    label: newWorkspaceName,
    description: ''
  })
