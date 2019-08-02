import { FETCH_CONFIG } from 'tracim_frontend_lib'

// FIXME - GB - 2019-07-24 - FolderID?
export const getShareFolder = (apiUrl, workspaceId, folderId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/folders/${folderId}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getContentTypeList = apiUrl =>
  fetch(`${apiUrl}/system/content_types`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

// export const getShareLinksList = (apiUrl, workspaceId, contentId) =>
//   fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/shares`, {
//     credentials: 'include',
//     headers: {
//       ...FETCH_CONFIG.headers
//     },
//     method: 'GET'
//   })

// export const postShareLinksList = (apiUrl, workspaceId, contentId, shareEmailsList, sharePassword) =>
//   fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/shares`, {
//     credentials: 'include',
//     headers: {
//       ...FETCH_CONFIG.headers
//     },
//     method: 'POST',
//     body: JSON.stringify({
//       emails: shareEmailsList
//       password: sharePassword
//     })
//   })

// export const deleteShareLink = (apiUrl, workspaceId, contentId, shareId) =>
//   fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/shares/${shareId}`, {
//     credentials: 'include',
//     headers: { 
//       ...FETCH_CONFIG.headers 
//     },
//     method: 'DELETE'
//   })