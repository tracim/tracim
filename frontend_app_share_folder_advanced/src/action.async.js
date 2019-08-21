import { FETCH_CONFIG } from 'tracim_frontend_lib'

// FIXME - GB - 2019-07-24 - FolderID?
export const getShareFolder = (apiUrl, workspaceId, folderId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/folders/${folderId}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getContentTypeList = apiUrl =>
  fetch(`${apiUrl}/system/content_types`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getImportAuthorizationsList = (apiUrl, workspaceId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/upload_permissions`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const deleteImportAuthorization = (apiUrl, workspaceId, authorizationId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/upload_permissions/${authorizationId}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'DELETE'
  })

export const postImportAuthorizationsList = (apiUrl, workspaceId, uploadEmailsList, uploadPassword) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/upload_permissions`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      emails: uploadEmailsList,
      password: uploadPassword
    })
  })
