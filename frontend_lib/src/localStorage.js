export const LOCAL_STORAGE_ITEM_TYPE = {
  RAW_CONTENT: 'rawContent',
  COMMENT: 'comment'
}

export const generateLocalStorageContentId = (workspaceId, contentId, contentType, dataType) => `${workspaceId}/${contentId}/${contentType}_${dataType}`

export function getLocalStorageItem (type, content, appName) {
  return localStorage.getItem(
    generateLocalStorageContentId(content.workspace_id, content.content_id, appName, type)
  )
}

export function removeLocalStorageItem (type, content, appName) {
  localStorage.removeItem(
    generateLocalStorageContentId(content.workspace_id, content.content_id, appName, type)
  )
}

export function setLocalStorageItem (type, content, appName, value) {
  localStorage.setItem(
    generateLocalStorageContentId(content.workspace_id, content.content_id, appName, type),
    value
  )
}
