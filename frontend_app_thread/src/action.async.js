import { FETCH_CONFIG } from './helper.js'

export const getThreadContent = (user, apiUrl, idWorkspace, idContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/threads/${idContent}`, {
    headers: {
      ...FETCH_CONFIG.headers,
      'Authorization': 'Basic ' + user.auth
    },
    method: 'GET'
  })

export const getThreadComment = (user, apiUrl, idWorkspace, idContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/comments`, {
    headers: {
      ...FETCH_CONFIG.headers,
      'Authorization': 'Basic ' + user.auth
    },
    method: 'GET'
  })

export const postThreadNewComment = (user, apiUrl, idWorkspace, idContent, newComment) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/comments`, {
    headers: {
      ...FETCH_CONFIG.headers,
      'Authorization': 'Basic ' + user.auth
    },
    method: 'POST',
    body: JSON.stringify({
      raw_content: newComment
    })
  })

export const putThreadStatus = (user, apiUrl, idWorkspace, idContent, newStatus) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/threads/${idContent}/status`, {
    headers: {
      ...FETCH_CONFIG.headers,
      'Authorization': 'Basic ' + user.auth
    },
    method: 'PUT',
    body: JSON.stringify({
      status: newStatus
    })
  })

export const postThreadContent = (user, apiUrl, idWorkspace, idFolder, contentType, newContentName) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents`, {
    headers: {
      ...FETCH_CONFIG.headers,
      'Authorization': 'Basic ' + user.auth
    },
    method: 'POST',
    body: JSON.stringify({
      parent_id: idFolder,
      content_type: contentType,
      label: newContentName
    })
  })

export const putThreadContent = (user, apiUrl, idWorkspace, idContent, label) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/threads/${idContent}`, {
    headers: {
      ...FETCH_CONFIG.headers,
      'Authorization': 'Basic ' + user.auth
    },
    method: 'PUT',
    body: JSON.stringify({
      label: label,
      raw_content: '' // threads have no content
    })
  })

export const putThreadIsArchived = (user, apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/archive`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putThreadIsDeleted = (user, apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/delete`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putThreadRestoreArchived = (user, apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/unarchive`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putThreadRestoreDeleted = (user, apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/undelete`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}
