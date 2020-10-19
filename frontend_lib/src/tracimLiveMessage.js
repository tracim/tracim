export { CONTENT_TYPE as TLM_SUB_TYPE } from './helper.js'

export const TLM_ENTITY_TYPE = {
  USER: 'user',
  CONTENT: 'content',
  MENTION: 'mention',
  SHAREDSPACE: 'workspace',
  SHAREDSPACE_MEMBER: 'workspace_member',
  SHAREDSPACE_SUBSCRIPTION: ' workspace_subscription'
}

export const TLM_CORE_EVENT_TYPE = {
  CREATED: 'created',
  MODIFIED: 'modified',
  DELETED: 'deleted',
  UNDELETED: 'undeleted'
}

export const TLM_STATE = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected'
}
