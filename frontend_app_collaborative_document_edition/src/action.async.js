import { baseFetch } from 'tracim_frontend_lib'

export const postCollaborativeDocumentFromTemplate = (apiUrl, workspaceId, folderId, contentType, filename, templateName, templateId) =>
  baseFetch('POST', `${apiUrl}/collaborative-document-edition/workspaces/${workspaceId}/files`, {
    parent_id: folderId || 0,
    template: templateName,
    filename: filename,
    template_id: templateId
  })

export const getCollaborativeDocumentTemplates = (apiUrl, workspaceId) =>
  baseFetch('GET', `${apiUrl}/collaborative-document-edition/templates`)

export const getWOPIToken = apiUrl =>
  baseFetch('GET', `${apiUrl}/collaborative-document-edition/token`)
