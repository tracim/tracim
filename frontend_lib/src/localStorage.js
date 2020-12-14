export const LOCAL_STORAGE_FIELD = {
  RAW_CONTENT: 'rawContent',
  COMMENT: 'comment'
}

export const generateLocalStorageContentId = (workspaceId, contentId, contentType, field) => `${workspaceId}/${contentId}/${contentType}_${field}`

export function getLocalStorageItem (contentType, content, field) {
  return localStorage.getItem(
    generateLocalStorageContentId(content.workspace_id, content.content_id, contentType, field)
  )
}

export function removeLocalStorageItem (contentType, content, field) {
  localStorage.removeItem(
    generateLocalStorageContentId(content.workspace_id, content.content_id, contentType, field)
  )
}

export function setLocalStorageItem (contentType, content, field, value) {
  localStorage.setItem(
    generateLocalStorageContentId(content.workspace_id, content.content_id, contentType, field),
    value
  )
}
