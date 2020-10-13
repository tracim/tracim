import { baseFetch } from 'tracim_frontend_lib'

export const getUserSpaces = (apiUrl, userId) => baseFetch('GET', `${apiUrl}/users/${userId}/workspaces`)

export const postSpace = (apiUrl, newDefaultRole, newParentSpace, newName, newType) =>
  baseFetch('POST', `${apiUrl}/workspaces`, {
    access_type: newType,
    default_user_role: newDefaultRole,
    description: '',
    label: newName,
    parent_id: newParentSpace
  })

export const getAllowedSpaceTypes = (apiUrl) =>
  baseFetch('GET', `${apiUrl}/system/workspace_access_types`)
