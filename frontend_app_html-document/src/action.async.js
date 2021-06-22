import { baseFetch } from 'tracim_frontend_lib'

export const getHtmlDocContent = (apiUrl, workspaceId, contentId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/html-documents/${contentId}`)

export const getHtmlDocComment = (apiUrl, workspaceId, contentId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/comments`)

export const getHtmlDocRevision = (apiUrl, workspaceId, contentId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/html-documents/${contentId}/revisions`)

export const putHtmlDocContent = (apiUrl, workspaceId, contentId, label, newContent) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspaceId}/html-documents/${contentId}`, {
    label: label,
    raw_content: newContent
  })

export const postHtmlDocContent = (apiUrl, workspaceId, folderId, contentType, newContentName) =>
  baseFetch('POST', `${apiUrl}/workspaces/${workspaceId}/contents`, {
    parent_id: folderId,
    content_type: contentType,
    label: newContentName
  })

export const putHtmlDocRead = (apiUrl, user, workspaceId, contentId) =>
  baseFetch('PUT', `${apiUrl}/users/${user.userId}/workspaces/${workspaceId}/contents/${contentId}/read`)
