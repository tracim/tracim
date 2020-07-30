import { FETCH_CONFIG } from 'tracim_frontend_lib'

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

export const putHtmlDocRead = (user, apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/users/${user.userId}/workspaces/${workspaceId}/contents/${contentId}/read`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const getMyselfKnownMember = (apiUrl, userNameToSearch, workspaceIdToExclude) => {
  return fetch(`${apiUrl}/users/me/known_members?acp=${userNameToSearch}&exclude_workspace_ids=${workspaceIdToExclude}`, {
    credentials: 'include',
    headers: { ...FETCH_CONFIG.headers },
    method: 'GET'
  })
}
