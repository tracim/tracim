import { baseFetch } from 'tracim_frontend_lib'

export const getFolder = (apiUrl, workspaceId, folderId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/folders/${folderId}`)

export const postFolder = (apiUrl, workspaceId, folderId, contentType, newFolderName) =>
  baseFetch('POST', `${apiUrl}/workspaces/${workspaceId}/contents`, {
    parent_id: folderId,
    content_type: contentType,
    label: newFolderName
  })

export const putFolder = (apiUrl, workspaceId, folderId, newLabel, description, availableAppList) =>
  // Côme - 2018/11/20 - description NYI
  baseFetch('PUT', `${apiUrl}/workspaces/${workspaceId}/folders/${folderId}`, {
    label: newLabel,
    raw_content: description,
    sub_content_types: availableAppList
  })
