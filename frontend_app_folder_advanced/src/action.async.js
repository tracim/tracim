import { FETCH_CONFIG } from './helper.js'

export const getFolder = (apiUrl, idWorkspace, idFolder) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/folders/${idFolder}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getAppList = apiUrl =>
  fetch(`${apiUrl}/system/applications`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const postFolder = (apiUrl, idWorkspace, idFolder, contentType, newFolderName) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      parent_id: idFolder,
      content_type: contentType,
      label: newFolderName
    })
  })

export const putFolder = (apiUrl, idWorkspace, idFolder, newLabel, description, availableAppList) =>
  // Côme - 2018/11/20 - description NYI
  fetch(`${apiUrl}/workspaces/${idWorkspace}/folders/${idFolder}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT',
    body: JSON.stringify({
      label: newLabel,
      raw_content: description,
      sub_content_types: availableAppList
    })
  })

export const putFolderStatus = (apiUrl, idWorkspace, idContent, newStatus) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/folders/${idContent}/status`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT',
    body: JSON.stringify({
      status: newStatus
    })
  })

export const putFolderIsArchived = (apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/archived`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putFolderIsDeleted = (apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/trashed`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putFolderRestoreArchived = (apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/archived/restore`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}

export const putFolderRestoreDeleted = (apiUrl, idWorkspace, idContent) => {
  return fetch(`${apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/trashed/restore`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
}
