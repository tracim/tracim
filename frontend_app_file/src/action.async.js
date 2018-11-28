import { FETCH_CONFIG } from './helper.js'

export const getFileContent = (apiUrl, idWorkspace, idContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getFileContentRaw = (apiUrl, idWorkspace, idContent) => // caper à 1900x1080
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}/raw`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getFileComment = (apiUrl, idWorkspace, idContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/comments`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getFileRevision = (apiUrl, idWorkspace, idContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}/revisions`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const postFileNewComment = (apiUrl, idWorkspace, idContent, newComment) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/comments`, {
    credentials: 'include',
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

export const putFileStatus = (apiUrl, idWorkspace, idContent, newStatus) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}/status`, {
    credentials: 'include',
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

export const putFileIsArchived = (apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/archived`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putFileIsDeleted = (apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/trashed`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putFileRestoreArchived = (apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/archived/restore`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putFileRestoreDeleted = (apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/trashed/restore`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putMyselfFileRead = (apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/users/me/workspaces/${idWorkspace}/contents/${idContent}/read`, {
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
