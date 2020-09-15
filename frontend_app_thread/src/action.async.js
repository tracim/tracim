import { baseFetch } from 'tracim_frontend_lib'

export const getThreadContent = (apiUrl, workspaceId, contentId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/threads/${contentId}`)

export const getThreadRevision = (apiUrl, workspaceId, contentId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/threads/${contentId}/revisions`)

export const postThreadContent = (apiUrl, workspaceId, folderId, contentType, newContentName) =>
  baseFetch('POST', `${apiUrl}/workspaces/${workspaceId}/contents`, {
    parent_id: folderId,
    content_type: contentType,
    label: newContentName
  })

export const putThreadRead = (user, apiUrl, workspaceId, contentId) =>
  baseFetch('PUT', `${apiUrl}/users/${user.userId}/workspaces/${workspaceId}/contents/${contentId}/read`)
