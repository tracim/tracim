import { FETCH_CONFIG } from './helper.js'

export const baseFetch = (method, url, body) =>
  fetch(url, {
    credentials: 'include',
    headers: FETCH_CONFIG.headers,
    method: method,
    body: body ? JSON.stringify(body) : undefined
  })

export const putEditContent = (apiUrl, workspaceId, contentId, appSlug, newTitle, newContent, propertiesToAddToBody) =>
  // INFO - CH - 2019-01-03 - Check the -s added to the app slug. This is and should stay consistent with app features
  baseFetch('PUT', `${apiUrl}/workspaces/${workspaceId}/${appSlug}s/${contentId}`, {
    label: newTitle,
    raw_content: newContent,
    ...propertiesToAddToBody
  })

export const postNewComment = (apiUrl, workspaceId, contentId, newComment) =>
  baseFetch('POST', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/comments`, {
    raw_content: newComment
  })

export const getContentComment = (apiUrl, workspaceId, contentId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/comments`)

export const putEditStatus = (apiUrl, workspaceId, contentId, appSlug, newStatus) =>
  // INFO - CH - 2019-01-03 - Check the -s added to the app slug. This is and should stay consistent with app features
  baseFetch('PUT', `${apiUrl}/workspaces/${workspaceId}/${appSlug}s/${contentId}/status`, {
    status: newStatus
  })

export const putContentArchived = (apiUrl, workspaceId, contentId) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/archived`)

export const putContentDeleted = (apiUrl, workspaceId, contentId) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/trashed`)

export const putContentRestoreArchive = (apiUrl, workspaceId, contentId) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/archived/restore`)

export const putContentRestoreDelete = (apiUrl, workspaceId, contentId) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/trashed/restore`)

export const getMyselfKnownMember = (apiUrl, userNameToSearch, workspaceIdToInclude, workspaceIdToExclude, limit = 0) => {
  let opts = ''
  if (workspaceIdToInclude) opts += `&include_workspace_ids=${workspaceIdToInclude}`
  if (workspaceIdToExclude) opts += `&exclude_workspace_ids=${workspaceIdToExclude}`
  if (limit) opts += `&limit=${limit}`
  return baseFetch('GET', `${apiUrl}/users/me/known_members?acp=${userNameToSearch}${opts}`)
}

const getResponse = async (url) => {
  const response = await baseFetch('GET', url)
  return {
    status: response.status,
    json: await response.json()
  }
}

export const getUsernameAvailability = (apiUrl, username) =>
  getResponse(`${apiUrl}/system/username-availability?username=${username}`)

export const getReservedUsernames = async (apiUrl) =>
  getResponse(`${apiUrl}/system/reserved-usernames`)

export const getWorkspaceDetail = (apiUrl, workspaceId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}`)

export const getWorkspaceMemberList = (apiUrl, workspaceId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/members`)

export const deleteWorkspace = (apiUrl, workspaceId) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspaceId}/trashed`)

export const getContentTypeList = (apiUrl) =>
  baseFetch('GET', `${apiUrl}/system/content_types`)

export const putUserConfiguration = (apiUrl, userId, config) =>
  baseFetch('PUT', `${apiUrl}/users/${userId}/config`, { parameters: config })

export const getFolderContentList = (apiUrl, workspaceId, folderIdList) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/contents?parent_ids=${folderIdList}&namespaces_filter=upload,content`)

export const getFolderDetail = (apiUrl, workspaceId, contentId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/folders/${contentId}`)

export const getFileContent = (apiUrl, workspaceId, contentId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/files/${contentId}`)

export const getWorkspaceContentList = (apiUrl, workspaceId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/contents?parent_ids=0`)

export const putFileIsDeleted = (apiUrl, workspaceId, contentId) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/trashed`)

export const getFileRevision = (apiUrl, workspaceId, contentId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/files/${contentId}/revisions`)

export const putFileContent = (apiUrl, workspaceId, contentId, label, newContent) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspaceId}/files/${contentId}`, {
    label: label,
    raw_content: newContent
  })

export const putMyselfFileRead = (apiUrl, workspaceId, contentId) =>
  baseFetch('PUT', `${apiUrl}/users/me/workspaces/${workspaceId}/contents/${contentId}/read`)
