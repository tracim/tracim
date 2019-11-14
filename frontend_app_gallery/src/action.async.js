import { FETCH_CONFIG } from 'tracim_frontend_lib'

export const getFolderContentList = (apiUrl, workspaceId, folderIdList) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}/contents?parent_ids=${folderIdList}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })
}

export const getFolderDetail = (apiUrl, workspaceId, contentId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/folders/${contentId}`, {
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

export const getWorkspaceDetail = (apiUrl, workspaceId) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })
}

export const getWorkspaceMemberList = (apiUrl, workspaceId) => {
  return fetch(`${apiUrl}/workspaces/${workspaceId}/members`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })
}
