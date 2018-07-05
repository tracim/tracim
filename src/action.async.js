import { FETCH_CONFIG } from './helper.js'

export const getHtmlDocContent = (apiUrl, idWorkspace, idContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/html-documents/${idContent}`, {
    ...FETCH_CONFIG,
    method: 'GET'
  })

export const getHtmlDocComment = (apiUrl, idWorkspace, idContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/comments`, {
    ...FETCH_CONFIG,
    method: 'GET'
  })

export const getHtmlDocRevision = (apiUrl, idWorkspace, idContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/html-documents/${idContent}/revisions`, {
    ...FETCH_CONFIG,
    method: 'GET'
  })

export const postHtmlDocNewComment = (apiUrl, idWorkspace, idContent, newComment) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/comments`, {
    ...FETCH_CONFIG,
    method: 'POST',
    body: JSON.stringify({
      raw_content: newComment
    })
  })

export const putHtmlDocContent = (apiUrl, idWorkspace, idContent, label, newContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/html-documents/${idContent}`, {
    ...FETCH_CONFIG,
    method: 'PUT',
    body: JSON.stringify({
      label: label,
      raw_content: newContent
    })
  })

export const putHtmlDocStatus = (apiUrl, idWorkspace, idContent, newStatus) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/html-documents/${idContent}/status`, {
    ...FETCH_CONFIG,
    method: 'PUT',
    body: JSON.stringify({
      status: newStatus
    })
  })

export const postHtmlDocContent = (apiUrl, idWorkspace, idFolder, contentType, newContentName) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents`, {
    ...FETCH_CONFIG,
    method: 'POST',
    body: JSON.stringify({
      parent_id: idFolder,
      content_type: contentType,
      label: newContentName
    })
  })
