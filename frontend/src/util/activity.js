import {
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  getContentComment,
  handleFetchResult,
  getWorkspaceContent
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
    newestMessage: message
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
    newestMessage: message
  }
}

// INFO - SG - 2020-11-12 - this function assumes that the list is ordered from newest to oldest
const createContentActivity = async (activityId, messageList, apiUrl) => {
  if (!messageList.length) throw new Error('Must have at least one message to build a content activity')
  const first = messageList[0]

  let content = first.fields.content
  if (content.content_type === TLM_ST.COMMENT) {
    const response = await handleFetchResult(await getWorkspaceContent(
      apiUrl, 
      first.fields.workspace.workspace_id, 
      content.parent_content_type + 's', 
      content.parent_id
    ))
    if (response.apiResponse.status === 200) {
      content = response.body
    }
  }

  const response = await handleFetchResult(await getContentComment(apiUrl, content.workspace_id, content.content_id))
  const commentList = response.apiResponse.status === 200 ? response.body : []
  return {
    id: activityId,
    entityType: first.event_type.split('.')[0],
    eventList: messageList.map(createActivityEvent),
    reactionList: [],
    commentList: commentList,
    newestMessage: first,
    content: content
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
      id = `e${message.event_id}`
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

const groupMessageListByActivityId = (messageList) => {
  const activityMap = new Map()
  for (const message of messageList) {
    const activityId = getActivityId(message)
    if (activityId !== null) {
      const activityMessageList = activityMap.get(activityId) || []
      activityMap.set(activityId, [...activityMessageList, message])
    }
  }

  return activityMap
}

const createActivityListFromActivityMap = async (activityMap, apiUrl) => {
  const activityCreationList = []
  for (const [activityId, activityMessageList] of activityMap) {
    activityCreationList.push(createActivity(activityId, activityMessageList, apiUrl))
  }
  return await Promise.all(activityCreationList)
}

/**
 * Merge an activity list with message/TLM list
 * messages are assumed to be older.
 * Activities are returned in newest to oldest order.
 * INFO - SB - 2020-11-12 - this function assumes that the message list is already ordered from newest to oldest.
 */
export const mergeWithActivityList = async (messageList, activityList, apiUrl) => {
  const activityMap = groupMessageListByActivityId(messageList)

  for (const activity of activityList) {
    if (activityMap.has(activity.id)) {
      activityMap.delete(activity.id)
    }
  }

  const newActivityList = await createActivityListFromActivityMap(activityMap, apiUrl)
  return [...activityList, ...newActivityList]
}

const newestMessageCreationOrder = (a, b) => {
  const aCreatedDate = new Date(a.newestMessage.created)
  const bCreatedDate = new Date(b.newestMessage.created)
  return bCreatedDate - aCreatedDate
}
/**
 * Sort an activity list from newest to oldest
 * Uses the newestMessage created attribute as the sort key.
 */
export const sortActivityList = (activityList) => {
  return [...activityList].sort(newestMessageCreationOrder)
}

/**
 * Add a message to an existing activity list.
 * If the message is not part of any activity, a new one will be created
 * and added at the beginning of the list
 * This WON'T re-order the list if the message is part of an existing
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
    ],
    commentList: message.event_type.endsWith(`.${TLM_ST.COMMENT}`)
      ? [message.fields.content, ...oldActivity.commentList]
      : oldActivity.commentList,
    newestMessage: message
  }
  const updatedActivityList = [...activityList]
  updatedActivityList[activityIndex] = updatedActivity
  return updatedActivityList
}
