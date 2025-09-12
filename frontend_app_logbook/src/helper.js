import { LOCAL_STORAGE_FIELD } from 'tracim_frontend_lib'

export const LOGBOOK_MIME_TYPE = 'application/json'
export const LOGBOOK_FILE_EXTENSION = '.logbook'

export const localStorageFieldIdBuilder = (entryId) => {
  const entryIdSafe = entryId || 'new'
  return `${entryIdSafe}/${LOCAL_STORAGE_FIELD.RAW_CONTENT}`
}
