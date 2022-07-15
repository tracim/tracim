export const LOCAL_STORAGE_FIELD = {
  COMMENT: 'comment',
  RAW_CONTENT: 'rawContent',
  TODO: 'todo'
}

export const generateLocalStorageContentId = (contentType, contentId, workspaceId, field) => `${workspaceId}/${contentId}/${contentType}_${field}`

export function getLocalStorageItem (contentType, contentId, workspaceId, field) {
  return localStorage.getItem(
    generateLocalStorageContentId(contentType, contentId, workspaceId, field)
  )
}

export function removeLocalStorageItem (contentType, contentId, workspaceId, field) {
  localStorage.removeItem(
    generateLocalStorageContentId(contentType, contentId, workspaceId, field)
  )
}

export function setLocalStorageItem (contentType, contentId, workspaceId, field, value) {
  localStorage.setItem(
    generateLocalStorageContentId(contentType, contentId, workspaceId, field),
    value
  )
}
