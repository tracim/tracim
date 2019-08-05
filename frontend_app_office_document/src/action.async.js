import { FETCH_CONFIG } from './helper.js'

export const postOfficeDocumentFromTemplate = (apiUrl, workspaceId, folderId, contentType, filename, templateName) =>
  fetch(`${apiUrl}/collaborative-document-edition/workspaces/${workspaceId}/files`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      parent_id: folderId || 0,
      template: templateName,
      filename: filename
    })
  })

export const getOfficeDocumentTemplates = (apiUrl, workspaceId) =>
  fetch(`${apiUrl}/collaborative-document-edition/templates`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getWOPIToken = apiUrl =>
  fetch(`${apiUrl}/collaborative-document-edition/token`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getFileContent = (apiUrl, workspaceId, contentId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/files/${contentId}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })
