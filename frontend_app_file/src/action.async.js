import { FETCH_CONFIG } from 'tracim_frontend_lib'

export const getFileContent = (apiUrl, workspaceId, contentId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/files/${contentId}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getFileComment = (apiUrl, workspaceId, contentId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/comments`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getFileRevision = (apiUrl, workspaceId, contentId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/files/${contentId}/revisions`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const putFileContent = (apiUrl, workspaceId, contentId, label, newContent) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/files/${contentId}`, {
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

export const putMyselfFileRead = (apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/users/me/workspaces/${workspaceId}/contents/${contentId}/read`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const getShareLinksList = (apiUrl, workspaceId, contentId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/shares`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const postShareLinksList = (apiUrl, workspaceId, contentId, shareEmailsList, sharePassword) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/shares`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      emails: shareEmailsList,
      password: sharePassword
    })
  })

export const deleteShareLink = (apiUrl, workspaceId, contentId, shareId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/shares/${shareId}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'DELETE'
  })
