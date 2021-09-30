import { CONTENT_TYPE } from './helper.js'

// TLM Event Type list
const USER = 'user'
const CONTENT = 'content'
const CONTENT_TAG = 'content_tag'
const MENTION = 'mention'
const REACTION = 'reaction'
const SHAREDSPACE = 'workspace'
const SHAREDSPACE_MEMBER = 'workspace_member'
const SHAREDSPACE_SUBSCRIPTION = 'workspace_subscription'
const TAG = 'tag'
const USER_CALL = 'user_call'

// TLM Core Event Type List
const CREATED = 'created'
const MODIFIED = 'modified'
const DELETED = 'deleted'
const UNDELETED = 'undeleted'

export const TLM_SUB_TYPE = CONTENT_TYPE

export const TLM_ENTITY_TYPE = {
  USER,
  CONTENT,
  CONTENT_TAG,
  MENTION,
  REACTION,
  SHAREDSPACE,
  SHAREDSPACE_MEMBER,
  SHAREDSPACE_SUBSCRIPTION,
  TAG,
  USER_CALL
}
export const TLM_CORE_EVENT_TYPE = {
  CREATED,
  MODIFIED,
  DELETED,
  UNDELETED
}
