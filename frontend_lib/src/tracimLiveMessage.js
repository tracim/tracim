import { CONTENT_TYPE } from './helper.js'

// TLM Event Type list
const USER = 'user'
const CONTENT = 'content'
const MENTION = 'mention'
const SHAREDSPACE = 'workspace'
const SHAREDSPACE_MEMBER = 'workspace_member'
const SHAREDSPACE_SUBSCRIPTION = 'workspace_subscription'

// TLM Core Event Type List
const CREATED = 'created'
const MODIFIED = 'modified'
const DELETED = 'deleted'
const UNDELETED = 'undeleted'

export const TLM_SUB_TYPE = CONTENT_TYPE

export const TLM_ENTITY_TYPE = {
  USER,
  CONTENT,
  MENTION,
  SHAREDSPACE,
  SHAREDSPACE_MEMBER,
  SHAREDSPACE_SUBSCRIPTION,
}
export const TLM_CORE_EVENT_TYPE = {
  CREATED,
  MODIFIED,
  DELETED,
  UNDELETED
}
