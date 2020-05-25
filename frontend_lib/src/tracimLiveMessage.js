import { CONTENT_TYPE } from './helper.js'

// TLM Event Type list
const USER = 'user'
const CONTENT = {
  FILE: `content.${CONTENT_TYPE.FILE}`,
  HTML_DOCUMENT: `content.${CONTENT_TYPE.HTML_DOCUMENT}`,
  THREAD: `content.${CONTENT_TYPE.THREAD}`,
  FOLDER: `content.${CONTENT_TYPE.FOLDER}`,
  COMMENT: `content.${CONTENT_TYPE.COMMENT}`
}
const SHAREDSPACE = 'workspace'
const SHAREDSPACE_USER_ROLE = 'workspace_user_role'

// TLM Core Event Type List
const CREATED = 'created'
const MODIFIED = 'modified'
const DELETED = 'deleted'

export const TLM_ENTITY_TYPE = {
  USER,
  CONTENT,
  SHAREDSPACE,
  SHAREDSPACE_USER_ROLE
}
export const TLM_CORE_EVENT_TYPE = {
  CREATED,
  MODIFIED,
  DELETED
}
