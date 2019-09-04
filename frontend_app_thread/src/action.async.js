import { FETCH_CONFIG } from 'tracim_frontend_lib'

export const getThreadContent = (apiUrl, workspaceId, contentId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/threads/${contentId}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getThreadComment = (apiUrl, workspaceId, contentId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/comments`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getThreadRevision = (apiUrl, workspaceId, contentId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/threads/${contentId}/revisions`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const postThreadNewComment = (apiUrl, workspaceId, contentId, newComment) =>
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

export const putThreadStatus = (apiUrl, workspaceId, contentId, newStatus) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/threads/${contentId}/status`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT',
    body: JSON.stringify({
      status: newStatus
    })
  })

export const postThreadContent = (apiUrl, workspaceId, folderId, contentType, newContentName) =>
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

export const putThreadContent = (apiUrl, workspaceId, contentId, label) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/threads/${contentId}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT',
    body: JSON.stringify({
      label: label,
      raw_content: '' // threads have no content
    })
  })

export const putThreadIsDeleted = (apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/trashed`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putThreadRestoreDeleted = (apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/trashed/restore`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putThreadRead = (user, apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/users/${user.user_id}/workspaces/${workspaceId}/contents/${contentId}/read`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}
