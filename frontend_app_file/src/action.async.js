import { FETCH_CONFIG } from './helper.js'

export const getFileContent = (user, apiUrl, idWorkspace, idContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getFileContentPreview = (user, apiUrl, idWorkspace, idContent, pageNum = 0) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}/preview/jpg?page=${pageNum}`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getFileContentRaw = (user, apiUrl, idWorkspace, idContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}/raw`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getFileComment = (user, apiUrl, idWorkspace, idContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/comments`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getFileRevision = (user, apiUrl, idWorkspace, idContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}/revisions`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const postFileNewComment = (user, apiUrl, idWorkspace, idContent, newComment) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/comments`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      raw_content: newComment
    })
  })

export const putFileContent = (user, apiUrl, idWorkspace, idContent, label, newContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'PUT',
    body: JSON.stringify({
      label: label,
      raw_content: newContent
    })
  })

export const putFileContentRaw = (user, apiUrl, idWorkspace, idContent, fileData) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}/raw`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      'Accept': 'application/json'
      // dont set content type when sending multipart/form-data. fetch will ad it properly
    },
    method: 'PUT',
    body: fileData
  })

export const putFileStatus = (user, apiUrl, idWorkspace, idContent, newStatus) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/files/${idContent}/status`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'PUT',
    body: JSON.stringify({
      status: newStatus
    })
  })

export const postFileContent = (user, apiUrl, idWorkspace, idFolder, contentType, uploadFileName) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      parent_id: idFolder,
      content_type: contentType,
      label: uploadFileName
    })
  })

export const putFileIsArchived = (user, apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/archive`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putFileIsDeleted = (user, apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/delete`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putFileRestoreArchived = (user, apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/unarchive`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putFileRestoreDeleted = (user, apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/undelete`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putFileRead = (user, apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/users/${user.user_id}/workspaces/${idWorkspace}/contents/${idContent}/read`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}
