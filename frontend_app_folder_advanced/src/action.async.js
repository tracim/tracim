import { FETCH_CONFIG } from 'tracim_frontend_lib'

export const getFolder = (apiUrl, workspaceId, folderId) =>
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

export const postFolder = (apiUrl, workspaceId, folderId, contentType, newFolderName) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/contents`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      parent_id: folderId,
      content_type: contentType,
      label: newFolderName
    })
  })

export const putFolder = (apiUrl, workspaceId, folderId, newLabel, description, availableAppList) =>
  // Côme - 2018/11/20 - description NYI
  fetch(`${apiUrl}/workspaces/${workspaceId}/folders/${folderId}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT',
    body: JSON.stringify({
      label: newLabel,
      raw_content: description,
      sub_content_types: availableAppList
    })
  })
