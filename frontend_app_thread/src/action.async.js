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
