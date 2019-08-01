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

// export const postShareLinksList = (apiUrl, workspaceId, shareLinkList) =>
//   fetch(`${apiUrl}/workspaces/${workspaceId}/share_folder`, {
//     credentials: 'include',
//     headers: {
//       ...FETCH_CONFIG.headers
//     },
//     method: 'PUT',
//     body: JSON.stringify({
//       share_link_list: shareLinkList
//     })
//   })

export const getShareLinksList = (apiUrl, workspaceId, contentId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/shares`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })
