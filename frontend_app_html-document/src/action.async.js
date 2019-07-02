import { FETCH_CONFIG } from './helper.js'

export const getHtmlDocContent = (apiUrl, workspaceId, contentId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/html-documents/${contentId}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getHtmlDocComment = (apiUrl, workspaceId, contentId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/comments`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getHtmlDocRevision = (apiUrl, workspaceId, contentId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/html-documents/${contentId}/revisions`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const postHtmlDocNewComment = (apiUrl, workspaceId, contentId, newComment) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/comments`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      raw_content: newComment
    })
  })

export const putHtmlDocContent = (apiUrl, workspaceId, contentId, label, newContent) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/html-documents/${contentId}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT',
    body: JSON.stringify({
      label: label,
      raw_content: newContent
    })
  })

export const putHtmlDocStatus = (apiUrl, workspaceId, contentId, newStatus) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/html-documents/${contentId}/status`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT',
    body: JSON.stringify({
      status: newStatus
    })
  })

export const postHtmlDocContent = (apiUrl, workspaceId, folderId, contentType, newContentName) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/contents`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      parent_id: folderId,
      content_type: contentType,
      label: newContentName
    })
  })

export const putHtmlDocIsArchived = (apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/archived`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putHtmlDocIsDeleted = (apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/trashed`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putHtmlDocRestoreArchived = (apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/archived/restore`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putHtmlDocRestoreDeleted = (apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/trashed/restore`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putHtmlDocRead = (user, apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/users/${user.user_id}/workspaces/${workspaceId}/contents/${contentId}/read`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}
