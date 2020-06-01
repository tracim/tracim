import { CONTENT_TYPE } from './helper.js'

// TLM Event Type list
const USER = 'user'
const CONTENT = 'content'
const SHAREDSPACE = 'workspace'
const SHAREDSPACE_USER_ROLE = 'workspace_user_role'

// TLM Core Event Type List
const CREATED = 'created'
const MODIFIED = 'modified'
const DELETED = 'deleted'
const UNDELETED = 'undeleted'

export const TLM_SUB_TYPE = {
  ...CONTENT_TYPE
}
export const TLM_ENTITY_TYPE = {
  USER,
  CONTENT,
  SHAREDSPACE,
  SHAREDSPACE_USER_ROLE
}
export const TLM_CORE_EVENT_TYPE = {
  CREATED,
  MODIFIED,
  DELETED,
  UNDELETED
}
