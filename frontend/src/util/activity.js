import {
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  getContentComment,
  handleFetchResult,
  getContent
} from 'tracim_frontend_lib'

const createActivityEvent = (message) => {
  return {
    eventId: message.event_id,
    eventType: message.event_type,
    author: message.fields.author,
    created: message.created
  }
}

const createMemberActivity = (activityId, messageList) => {
  if (messageList.length !== 1) throw new Error('Must have at exactly one message to build a member activity')
  const message = messageList[0]
  return {
    id: activityId,
    entityType: message.event_type.split('.')[0],
    eventList: [createActivityEvent(message)],
    reactionList: [],
    fields: {
      user: message.fields.user,
      member: message.fields.member
    }
  }
}

const createSubscriptionActivity = (activityId, messageList) => {
  if (messageList.length !== 1) throw new Error('Must have at exactly one message to build a subscription activity')
  const message = messageList[0]
  return {
    id: activityId,
    entityType: message.event_type.split('.')[0],
    eventList: [createActivityEvent(message)],
    reactionList: [],
    fields: {
      user: message.fields.user,
      subscription: message.fields.subscription
    }
  }
}

// NOTE: this function assumes that the list is ordered from newest to oldest
const createContentActivity = async (activityId, messageList, apiUrl) => {
  if (!messageList.length) throw new Error('Must have at least one message to build a content activity')
  const first = messageList[0]

  let content = first.fields.content
  if (content.content_type === TLM_ST.COMMENT) {
    content = (await handleFetchResult(await getContent(apiUrl, content.parent_id))).body
  }

  const comments = (await handleFetchResult(await getContentComment(apiUrl, content.workspace_id, content.content_id))).body
  return {
    id: activityId,
    entityType: first.event_type.split('.')[0],
    eventList: messageList.map(createActivityEvent),
    reactionList: [],
    fields: {
      content: content,
      comments: comments
    }
  }
}

const getActivityId = (message) => {
  const [entityType, , subEntityType] = message.event_type.split('.')
  let id = null
  switch (entityType) {
    case TLM_ET.CONTENT:
      id = (subEntityType === TLM_ST.COMMENT)
        ? message.fields.content.parent_id
        : message.fields.content.content_id
      break
    case TLM_ET.SHAREDSPACE_MEMBER:
    case TLM_ET.SHAREDSPACE_SUBSCRIPTION:
      id = `w${message.fields.workspace.workspace_id}-u${message.fields.user.user_id}`
      break
  }
  if (id === null) return null
  return `${entityType}-${id}`
}

const createActivity = async (activityId, activityMessageList, apiUrl) => {
  if (activityId.startsWith(TLM_ET.CONTENT)) {
    return await createContentActivity(activityId, activityMessageList, apiUrl)
  } else if (activityId.startsWith(TLM_ET.SHAREDSPACE_MEMBER)) {
    return createMemberActivity(activityId, activityMessageList)
  } else if (activityId.startsWith(TLM_ET.SHAREDSPACE_SUBSCRIPTION)) {
    return createSubscriptionActivity(activityId, activityMessageList)
  }
}

/**
 * Create an activity list from a message/TLM list
 * Activities are returned in newest to oldest order.
 * NOTE: this function assumes that the message list is already ordered from newest to oldest.
 */
export const createActivityList = async (messageList, apiUrl) => {
  const activityMap = new Map()

  // first regroup by activity
  for (const message of messageList) {
    const activityId = getActivityId(message)
    if (activityId !== null) {
      const activityMessageList = activityMap.get(activityId) || []
      activityMap.set(activityId, [...activityMessageList, message])
    }
  }

  // we now have a map of messages grouped by activity
  // TODO: parallelize this(?)
  const activityList = []
  for (const [activityId, activityMessageList] of activityMap) {
    activityList.push(await createActivity(activityId, activityMessageList, apiUrl))
  }

  return activityList
}

/**
 * Add a message to an existing activity list.
 * If the message is not part of any activity, a new one will be created
 * and added at the beginning of the list
 * This WON't re-order the list if the message is part of an existing
 * activity.
 * @param {*} message
 * @param {*} activityList
 */
export const addMessageToActivityList = async (message, activityList, apiUrl) => {
  const activityId = getActivityId(message)
  const activityIndex = activityList.findIndex(a => a.id === activityId)
  if (activityIndex === -1) {
    const activity = await createActivity(activityId, [message], apiUrl)
    return [activity, ...activityList]
  }
  const oldActivity = activityList[activityIndex]
  const updatedActivity = {
    ...oldActivity,
    eventList: [
      createActivityEvent(message),
      ...oldActivity.eventList
    ]
  }
  const updatedActivityList = [...activityList]
  updatedActivityList[activityIndex] = updatedActivity
  return updatedActivityList
}
