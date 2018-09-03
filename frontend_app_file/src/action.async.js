import { FETCH_CONFIG } from './helper.js'

export const getFileContent = (apiUrl, idWorkspace, idContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}`, {
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getFileContentPreview = (apiUrl, idWorkspace, idContent, pageNum) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}/preview/jpg/500x500?page=${pageNum}`, {
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getFileContentPreviewRevision = (apiUrl, idWorkspace, idContent, pageNum, idRevision) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}/revisions/${idRevision}/preview/jpg/500x500`, {
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getFileContentRaw = (apiUrl, idWorkspace, idContent) => // caper à 1900x1080
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}/raw`, {
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getFileContentRawRevision = (apiUrl, idWorkspace, idContent, idRevision) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}/revisions/${idRevision}/raw`, {
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getFileComment = (apiUrl, idWorkspace, idContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/comments`, {
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getFileRevision = (apiUrl, idWorkspace, idContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}/revisions`, {
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const postFileNewComment = (apiUrl, idWorkspace, idContent, newComment) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/comments`, {
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      raw_content: newComment
    })
  })

export const putFileContent = (apiUrl, idWorkspace, idContent, label, newContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}`, {
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT',
    body: JSON.stringify({
      label: label,
      raw_content: newContent
    })
  })

export const putFileStatus = (apiUrl, idWorkspace, idContent, newStatus) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}/status`, {
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT',
    body: JSON.stringify({
      status: newStatus
    })
  })

export const postFileContent = (apiUrl, idWorkspace, idFolder, contentType, uploadFileName) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents`, {
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      // parent_id: idFolder,
      content_type: contentType,
      label: uploadFileName
    })
  })

export const putFileIsArchived = (apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/archive`, {
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putFileIsDeleted = (apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/delete`, {
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putFileRestoreArchived = (apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/unarchive`, {
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putFileRestoreDeleted = (apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/undelete`, {
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putFileRead = (user, apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/users/${user.user_id}/workspaces/${idWorkspace}/contents/${idContent}/read`, {
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}
