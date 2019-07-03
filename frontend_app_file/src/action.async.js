import { FETCH_CONFIG } from 'tracim_frontend_lib'

export const getFileContent = (apiUrl, workspaceId, contentId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/files/${contentId}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getFileContentRaw = (apiUrl, workspaceId, contentId) => // caper à 1900x1080
  fetch(`${apiUrl}/workspaces/${workspaceId}/files/${contentId}/raw`, {
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

export const postFileNewComment = (apiUrl, workspaceId, contentId, newComment) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/comments`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      raw_content: newComment
    })
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

export const putFileStatus = (apiUrl, workspaceId, contentId, newStatus) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/files/${contentId}/status`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT',
    body: JSON.stringify({
      status: newStatus
    })
  })

export const postFileContent = (apiUrl, workspaceId, folderId, contentType, uploadFileName) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/contents`, {
    credentials: 'include',
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

export const putFileIsArchived = (apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/archived`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putFileIsDeleted = (apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/trashed`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putFileRestoreArchived = (apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/archived/restore`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putFileRestoreDeleted = (apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/trashed/restore`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putMyselfFileRead = (apiUrl, workspaceId, contentId) => {
  return fetch(`${apiUrl}/users/me/workspaces/${workspaceId}/contents/${contentId}/read`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

// export const getFilePdf = pdfUrl => {
//   return fetch(`${pdfUrl}`, {
//     credentials: 'include',
//     headers: {},
//     method: 'GET'
//   })
// }
