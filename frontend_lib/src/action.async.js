import { CONTENT_NAMESPACE, FETCH_CONFIG } from './helper.js'

export const baseFetch = (method, url, body) =>
  fetch(url, {
    credentials: 'include',
    headers: FETCH_CONFIG.headers,
    method: method,
    body: body ? JSON.stringify(body) : undefined
  })

export const getContentPath = (apiUrl, workspaceId, contentId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/path`)

export const putEditContent = (apiUrl, workspaceId, contentId, appSlug, newTitle, newContent, propertiesToAddToBody) =>
  // INFO - CH - 2019-01-03 - Check the -s added to the app slug. This is and should stay consistent with app features
  baseFetch('PUT', `${apiUrl}/workspaces/${workspaceId}/${appSlug}s/${contentId}`, {
    label: newTitle,
    raw_content: newContent,
    ...propertiesToAddToBody
  })

export const postNewComment = (apiUrl, workspaceId, contentId, newComment, namespace) =>
  baseFetch('POST', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/comments`, {
    raw_content: newComment,
    content_namespace: namespace
  })

export const deleteComment = (apiUrl, workspaceId, contentId, commentId) =>
  baseFetch('DELETE', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/comments/${commentId}`)

export const putComment = (apiUrl, workspaceId, contentId, commentId, newComment) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/comments/${commentId}`, {
    raw_content: newComment
  })

export const getContentComment = (apiUrl, workspaceId, contentId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/comments`)

export const getFileChildContent = (apiUrl, workspaceId, contentId) => {
  const queryParam = `parent_ids=${contentId}&content_type=file&namespaces_filter=${CONTENT_NAMESPACE.CONTENT},${CONTENT_NAMESPACE.PUBLICATION}`
  return baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/contents?${queryParam}`)
}

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

export const getMyselfKnownContents = (apiUrl, searchString, limit) => {
  const queryParameterList = []
  queryParameterList.push(`acp=${encodeURIComponent(searchString)}`)
  if (Number.isInteger(limit)) queryParameterList.push(`limit=${limit}`)

  return baseFetch('GET', `${apiUrl}/users/me/known_contents?${queryParameterList.join('&')}`)
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

export const getUrlPreview = (apiUrl, url) =>
  baseFetch('GET', `${apiUrl}/url-preview?url=${encodeURIComponent(url)}`)

export const putFileDescription = (apiUrl, workspaceId, contentId, label, newDescription) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspaceId}/files/${contentId}`, {
    label: label,
    description: newDescription
  })

export const putMyselfFileRead = (apiUrl, workspaceId, contentId) =>
  baseFetch('PUT', `${apiUrl}/users/me/workspaces/${workspaceId}/contents/${contentId}/read`)

export const getContent = (apiUrl, contentId) =>
  baseFetch('GET', `${apiUrl}/contents/${contentId}`)

export const getContentReactionList = (apiUrl, workspaceId, contentId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/reactions`)

export const postContentReaction = (apiUrl, workspaceId, contentId, value) =>
  baseFetch('POST', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/reactions`, { value })

export const deleteContentReaction = (apiUrl, workspaceId, contentId, reactionId) =>
  baseFetch('DELETE', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/reactions/${reactionId}`)

export const getWorkspaceContent = (apiUrl, workspaceId, contentType, contentId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/${contentType}/${contentId}`)

export const getCommentTranslated = (apiUrl, workspaceId, contentId, commentId, targetLanguageCode) => {
  const name = `comment-${commentId}.html`
  return baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/comments/${commentId}/translated/${name}?target_language_code=${targetLanguageCode}`)
}

export const getHtmlDocTranslated = (apiUrl, workspaceId, contentId, revisionId, targetLanguageCode) => {
  const name = `content-${contentId}-${targetLanguageCode}.html`
  const url = `${apiUrl}/workspaces/${workspaceId}/html-documents/${contentId}/revisions/${revisionId}/translated/${name}?target_language_code=${targetLanguageCode}`
  return baseFetch('GET', url)
}

export const getFavoriteContentList = (apiUrl, userId) => {
  return baseFetch('GET', `${apiUrl}/users/${userId}/favorite-contents`)
}

export const postContentToFavoriteList = (apiUrl, userId, contentId) => {
  return baseFetch('POST', `${apiUrl}/users/${userId}/favorite-contents`, { content_id: contentId })
}

export const deleteContentFromFavoriteList = (apiUrl, userId, contentId) => {
  return baseFetch('DELETE', `${apiUrl}/users/${userId}/favorite-contents/${contentId}`)
}

export const getGenericWorkspaceContent = (apiUrl, workspaceId, contentId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}`)

export const getContentTagList = (apiUrl, workspaceId, contentId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/tags`)

export const getWorkspaceTagList = (apiUrl, workspaceId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/tags`)

export const postWorkspaceTag = (apiUrl, workspaceId, tagName) =>
  baseFetch('POST', `${apiUrl}/workspaces/${workspaceId}/tags`, { tag_name: tagName })

export const postContentTag = (apiUrl, workspaceId, contentId, tagName) =>
  baseFetch('POST', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/tags`, { tag_name: tagName })

export const putContentTag = (apiUrl, workspaceId, contentId, tagId) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/tags/${tagId}`)

export const deleteContentTag = (apiUrl, workspaceId, contentId, tagId) =>
  baseFetch('DELETE', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/tags/${tagId}`)

export const deleteWorkspaceTag = (apiUrl, workspaceId, tagId) =>
  baseFetch('DELETE', `${apiUrl}/workspaces/${workspaceId}/tags/${tagId}`)
