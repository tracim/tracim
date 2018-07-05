import { FETCH_CONFIG } from './helper.js'

export const getThreadContent = (apiUrl, idWorkspace, idContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/threads/${idContent}`, {
    ...FETCH_CONFIG,
    method: 'GET'
  })

export const getThreadComment = (apiUrl, idWorkspace, idContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/comments`, {
    ...FETCH_CONFIG,
    method: 'GET'
  })

export const postThreadNewComment = (apiUrl, idWorkspace, idContent, newComment) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/comments`, {
    ...FETCH_CONFIG,
    method: 'POST',
    body: JSON.stringify({
      raw_content: newComment
    })
  })

export const putThreadStatus = (apiUrl, idWorkspace, idContent, newStatus) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/threads/${idContent}/status`, {
    ...FETCH_CONFIG,
    method: 'PUT',
    body: JSON.stringify({
      status: newStatus
    })
  })

export const postThreadContent = (apiUrl, idWorkspace, idFolder, contentType, newContentName) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents`, {
    ...FETCH_CONFIG,
    method: 'POST',
    body: JSON.stringify({
      parent_id: idFolder,
      content_type: contentType,
      label: newContentName
    })
  })

export const putThreadContent = (apiUrl, idWorkspace, idContent, label) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/threads/${idContent}`, {
    ...FETCH_CONFIG,
    method: 'PUT',
    body: JSON.stringify({
      label: label,
      raw_content: '' // threads have no content
    })
  })
