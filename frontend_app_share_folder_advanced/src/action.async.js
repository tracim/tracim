import { baseFetch } from 'tracim_frontend_lib'

// FIXME - GB - 2019-07-24 - FolderID?
export const getShareFolder = (apiUrl, workspaceId, folderId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/folders/${folderId}`)

export const getImportAuthorizationsList = (apiUrl, workspaceId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/upload_permissions`)

export const deleteImportAuthorization = (apiUrl, workspaceId, authorizationId) =>
  baseFetch('DELETE', `${apiUrl}/workspaces/${workspaceId}/upload_permissions/${authorizationId}`)

export const postImportAuthorizationsList = (apiUrl, workspaceId, uploadEmailsList, uploadPassword) =>
  baseFetch('POST', `${apiUrl}/workspaces/${workspaceId}/upload_permissions`, {
    emails: uploadEmailsList,
    password: uploadPassword
  })
