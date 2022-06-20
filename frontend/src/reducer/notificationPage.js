import { uniqBy } from 'lodash'
import {
  ADD,
  APPEND,
  CONTENT,
  NEXT_PAGE,
  NOTIFICATION,
  NOTIFICATION_LIST,
  READ,
  SET,
  UNREAD_MENTION_COUNT,
  UNREAD_NOTIFICATION_COUNT,
  UPDATE,
  USER_DISCONNECTED
} from '../action-creator.sync.js'
import { serializeContentProps } from './workspaceContentList.js'
import { serializeWorkspaceListProps } from './workspaceList.js'
import { serializeUserProps } from './user.js'
import {
  CONTENT_TYPE,
  serialize,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET
} from 'tracim_frontend_lib'

const defaultNotificationsObject = {
  list: [],
  hasNextPage: false,
  nextPageToken: '',
  unreadMentionCount: 0,
  unreadNotificationCount: 0
}

// FIXME - GB - 2020-07-30 - We can't use the global serializer in this case because it doesn't handle nested object
// See https://github.com/tracim/tracim/issues/3229
export const serializeNotification = notification => {
  return {
    ...notification.fields,
    author: {
      publicName: notification.fields.author.public_name,
      userId: notification.fields.author.user_id,
      hasAvatar: notification.fields.author.has_avatar,
      hasCover: notification.fields.author.has_cover
    },
    user: notification.fields.user ? serialize(notification.fields.user, serializeUserProps) : null,
    subscription: notification.fields.subscription ? {
      ...notification.fields.subscription,
      author: serialize(notification.fields.subscription.author, serializeUserProps)
    } : null,
    content: notification.fields.content ? serialize(notification.fields.content, serializeContentProps) : null,
    created: notification.created,
    id: notification.event_id,
    read: notification.read,
    type: notification.event_type,
    workspace: notification.fields.workspace ? serialize(notification.fields.workspace, serializeWorkspaceListProps) : null
  }
}

function sortByCreatedDate (arrayToSort) {
  return arrayToSort.sort(function (a, b) {
    if (a.created < b.created) return 1
    if (a.created > b.created) return -1
    return 0
  })
}

function getMainContentId (notification) {
  return notification.type.includes(CONTENT_TYPE.COMMENT) || notification.type.includes(TLM_ET.MENTION)
    ? notification.content.parentId
    : notification.content.id
}

// FIXME - GB - 2022-04-21 - this code is very similar to activityDisplayFilter
// in withActivity and ActivityList, and can be refactor
// See https://github.com/tracim/tracim/issues/4677
function notificationListDisplayFilter (notificationList, spaceList, unreadNotificationCount) {
  let newUnreadNotificationCount = unreadNotificationCount
  const newNotificationList = notificationList.map((notification) => {
    const [entityType] = notification.type.split('.')

    if (
      (entityType === TLM_ET.SHAREDSPACE_MEMBER || entityType === TLM_ET.SHAREDSPACE_SUBSCRIPTION) &&
      !(spaceList.find(space => space.id === notification.workspace.id))
    ) {
      if (!notification.read) newUnreadNotificationCount--
      return null
    }
    return notification
  })
  return { list: newNotificationList.filter(notification => !!notification), unreadNotificationCount: newUnreadNotificationCount }
}

export default function notificationPage (state = defaultNotificationsObject, action) {
  switch (action.type) {
    case `${SET}/${NOTIFICATION_LIST}`: {
      const notificationList = action.notificationList
        .map(notification => serializeNotification(notification))
      return {
        ...state,
        ...notificationListDisplayFilter(notificationList, action.spaceList, state.unreadNotificationCount)
      }
    }

    case `${APPEND}/${NOTIFICATION_LIST}`: {
      const notificationList = action.notificationList
        .map(notification => serializeNotification(notification))
      return {
        ...state,
        ...notificationListDisplayFilter([...state.list, ...notificationList], action.spaceList, state.unreadNotificationCount)
      }
    }

    case `${ADD}/${NOTIFICATION}`: {
      const notification = serializeNotification(action.notification)
      const newUnreadMentionCount = notification.type === `${TLM_ET.MENTION}.${TLM_CET.CREATED}` ? state.unreadMentionCount + 1 : state.unreadMentionCount
      return {
        ...state,
        unreadMentionCount: newUnreadMentionCount,
        ...notificationListDisplayFilter(sortByCreatedDate([...state.list, notification]), action.spaceList, state.unreadNotificationCount + 1)
      }
    }

    case `${UPDATE}/${NOTIFICATION}`: {
      const index = state.list.findIndex(notification => notification.id === action.notificationId)
      const newNotificationList = [
        ...state.list.slice(0, index),
        ...action.notificationList,
        ...state.list.slice(index + 1, state.list.length)
      ]
      return {
        ...state,
        list: newNotificationList
      }
    }

    case `${READ}/${NOTIFICATION}`: {
      const notification = state.list.find(notification => notification.id === action.notificationId && !notification.read)

      if (!notification) return state

      const newUnreadMentionCount = (notification.type === `${TLM_ET.MENTION}.${TLM_CET.CREATED}`) ? state.unreadMentionCount - 1 : state.unreadMentionCount
      const replaceList = state.list.map(no => no.id === action.notificationId ? { ...notification, read: true } : no)

      const newUnreadNotificationCount = state.unreadNotificationCount - 1

      return {
        ...state,
        list: replaceList,
        unreadMentionCount: newUnreadMentionCount,
        unreadNotificationCount: newUnreadNotificationCount
      }
    }

    case `${READ}/${NOTIFICATION_LIST}`: {
      const notificationList = state.list.map(notification => ({ ...notification, read: true }))
      return { ...state, list: uniqBy(notificationList, 'id'), unreadMentionCount: 0, unreadNotificationCount: 0 }
    }

    case `${READ}/${CONTENT}/${NOTIFICATION}`: {
      let unreadMentionCount = state.unreadMentionCount
      let unreadNotificationCount = state.unreadNotificationCount
      const markNotificationAsRead = (notification) => {
        if (!notification.content) return notification
        if (getMainContentId(notification) === action.contentId) {
          if (!notification.read) {
            if (notification.type.includes(TLM_ET.MENTION)) unreadMentionCount--
            unreadNotificationCount--
          }
          return { ...notification, read: true }
        }
        return notification
      }

      const newNotificationList = state.list.map(notification => {
        return markNotificationAsRead(notification)
      })

      return { ...state, list: uniqBy(newNotificationList, 'id'), unreadMentionCount, unreadNotificationCount }
    }

    case `${SET}/${NEXT_PAGE}`:
      return { ...state, hasNextPage: action.hasNextPage, nextPageToken: action.nextPageToken }

    case `${SET}/${UNREAD_MENTION_COUNT}`:
      return { ...state, unreadMentionCount: action.count }

    case `${SET}/${UNREAD_NOTIFICATION_COUNT}`:
      return { ...state, unreadNotificationCount: action.count + state.unreadNotificationCount }

    case `${SET}/${USER_DISCONNECTED}`:
      return defaultNotificationsObject

    default:
      return state
  }
}
