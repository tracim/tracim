import { baseFetch } from 'tracim_frontend_lib'

export const getUserSpaces = (apiUrl, userId) => baseFetch('GET', `${apiUrl}/users/${userId}/workspaces`)

export const postWorkspace = (apiUrl, newWorkspaceName, newType, newDefaultRole) =>
  baseFetch('POST', `${apiUrl}/workspaces`, {
    label: newWorkspaceName,
    description: '',
    access_type: newType,
    default_user_role: newDefaultRole
  })
