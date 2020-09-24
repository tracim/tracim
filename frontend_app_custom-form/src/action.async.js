import { baseFetch } from 'tracim_frontend_lib'

export const getCustomFormContent = (apiUrl, idWorkspace, idContent) =>
  baseFetch('GET', `${apiUrl}/workspaces/${idWorkspace}/custom-form/${idContent}`)

export const getCustomFormRevision = (apiUrl, idWorkspace, idContent) =>
  baseFetch('GET', `${apiUrl}/workspaces/${idWorkspace}/html-documents/${idContent}/revisions`)

export const postCustomFormNewComment = (apiUrl, idWorkspace, idContent, newComment) =>
  baseFetch('POST', `${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/comments`, {
    raw_content: newComment
  })

export const putCustomFormContent = (apiUrl, idWorkspace, idContent, label, newContent) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${idWorkspace}/html-documents/${idContent}`, {
    label: label,
    raw_content: newContent
  })

export const putCustomFormStatus = (apiUrl, idWorkspace, idContent, newStatus) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${idWorkspace}/html-documents/${idContent}/status`, {
    status: newStatus
  })

export const postCustomFormContent = (apiUrl, idWorkspace, idFolder, contentType, newContentName) =>
  baseFetch('POST', `${apiUrl}/workspaces/${idWorkspace}/contents`, {
    parent_id: idFolder,
    content_type: contentType,
    label: newContentName
  })

export const putCustomFormIsArchived = (apiUrl, idWorkspace, idContent) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/archived`)

export const putCustomFormIsDeleted = (apiUrl, idWorkspace, idContent) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/trashed`)

export const putCustomFormRestoreArchived = (apiUrl, idWorkspace, idContent) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/archived/restore`)

export const putCustomFormRestoreDeleted = (apiUrl, idWorkspace, idContent) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/trashed/restore`)

export const putCustomFormRead = (user, apiUrl, idWorkspace, idContent) =>
  baseFetch('PUT', `${apiUrl}/users/${user.user_id}/workspaces/${idWorkspace}/contents/${idContent}/read`)
