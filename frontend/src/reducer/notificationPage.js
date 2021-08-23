import { uniqBy } from 'lodash'
import {
  ADD,
  APPEND,
  NEXT_PAGE,
  NOTIFICATION,
  NOTIFICATION_LIST,
  SET,
  READ,
  UNREAD_MENTION_COUNT,
  UNREAD_NOTIFICATION_COUNT,
  USER_DISCONNECTED
} from '../action-creator.sync.js'
import { serialize } from 'tracim_frontend_lib'
import { serializeContentProps } from './workspaceContentList.js'
import { serializeWorkspaceListProps } from './workspaceList.js'
import { serializeUserProps } from './user.js'

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

const groupNotificationList = (notificationList) => {
  let newNotificationList = []
  let newIndex = 0
  notificationList.forEach((notification, index) => {
    let content = false
    let workspace = false
    let author = false
    if (index < 2) return
    // debugger
    if (newNotificationList[newIndex - 1] &&
      newNotificationList[newIndex - 1].type.startsWith('group')
    ) {
      if (
        newNotificationList[newIndex - 1].type.match('group.content.workspace.author') &&
        newNotificationList[newIndex - 1].content.id === notification.content.id &&
        newNotificationList[newIndex - 1].workspace.id === notification.workspace.id &&
        newNotificationList[newIndex - 1].author.userId === notification.author.userId
      ) {
        newNotificationList[newIndex - 1].group.push(notification)
        return
      }

      if (
        newNotificationList[newIndex - 1].type.match('group.content.workspace') &&
        newNotificationList[newIndex - 1].content.id === notification.content.id &&
        newNotificationList[newIndex - 1].workspace.id === notification.workspace.id
      ) {
        newNotificationList[newIndex - 1].group.push(notification)
        return
      }

      if (
        newNotificationList[newIndex - 1].type.match('group.content.author') &&
        newNotificationList[newIndex - 1].content.id === notification.content.id &&
        newNotificationList[newIndex - 1].author.userId === notification.author.userId
      ) {
        newNotificationList[newIndex - 1].group.push(notification)
        return
      }

      if (
        newNotificationList[newIndex - 1].type.match('group.author.workspace') &&
        newNotificationList[newIndex - 1].author.userId === notification.author.userId &&
        newNotificationList[newIndex - 1].workspace.id === notification.workspace.id
      ) {
        newNotificationList[newIndex - 1].group.push(notification)
        return
      }
    }

    if (
      notificationList[index - 2].content &&
      notificationList[index - 1].content &&
      notificationList[index].content
    ) {
      const contentId0 = notificationList[index].type.includes('comment') ? notificationList[index].content.parentId : notificationList[index].content.id
      const contentId1 = notificationList[index - 1].type.includes('comment') ? notificationList[index - 1].content.parentId : notificationList[index - 1].content.id
      const contentId2 = notificationList[index - 2].type.includes('comment') ? notificationList[index - 2].content.parentId : notificationList[index - 2].content.id
      if (contentId2 === contentId1 && contentId1 === contentId0) content = true
    }
    if (
      notificationList[index - 2].workspace &&
      notificationList[index - 1].workspace &&
      notificationList[index].workspace &&
      notificationList[index - 2].workspace.id === notificationList[index - 1].workspace.id &&
      notificationList[index - 1].workspace.id === notificationList[index].workspace.id
    ) {
      workspace = true
    }
    if (
      notificationList[index - 2].author &&
      notificationList[index - 1].author &&
      notificationList[index].author &&
      notificationList[index - 2].author.userId === notificationList[index - 1].author.userId &&
      notificationList[index - 1].author.userId === notificationList[index].author.userId
    ) {
      author = true
    }

    newIndex++

    if (content && workspace && author) {
      newNotificationList.push({
        ...notification,
        read: notificationList[index - 2].read && notificationList[index - 1].read && notificationList[index].read,
        type: 'group.content.workspace.author',
        group: [notificationList[index - 2], notificationList[index - 1], notification]
      })
      return
    }

    if (content && workspace) {
      newNotificationList.push({
        ...notification,
        read: notificationList[index - 2].read && notificationList[index - 1].read && notificationList[index].read,
        type: 'group.content.workspace',
        group: [notificationList[index - 2], notificationList[index - 1], notification]
      })
      return
    }

    if (content && author) {
      newNotificationList.push({
        ...notification,
        read: notificationList[index - 2].read && notificationList[index - 1].read && notificationList[index].read,
        type: 'group.content.author',
        group: [notificationList[index - 2], notificationList[index - 1], notification]
      })
      return
    }

    if (author && workspace) {
      newNotificationList.push({
        ...notification,
        read: notificationList[index - 2].read && notificationList[index - 1].read && notificationList[index].read,
        type: 'group.author.workspace',
        group: [notificationList[index - 2], notificationList[index - 1], notification]
      })
      return
    }

    newNotificationList.push(notificationList[index - 2]) // FIXME - Adding the wrong one
  })
  console.log('newNotificationList', newNotificationList)
}

export default function notificationPage (state = defaultNotificationsObject, action) {
  const mentionCreated = 'mention.created'
  switch (action.type) {
    case `${SET}/${NOTIFICATION_LIST}`: {
      const notificationList = action.notificationList
        .map(no => (serializeNotification(no)))
      groupNotificationList(notificationList)
      return { ...state, list: uniqBy(notificationList, 'id') }
    }

    case `${APPEND}/${NOTIFICATION_LIST}`: {
      const notificationList = action.notificationList
        .map(notification => (serializeNotification(notification)))
      return {
        ...state,
        list: uniqBy([...state.list, ...notificationList], 'id')
      }
    }

    case `${ADD}/${NOTIFICATION}`: {
      const notification = serializeNotification(action.notification)
      const newUnreadMentionCount = notification.type === mentionCreated ? state.unreadMentionCount + 1 : state.unreadMentionCount
      return {
        ...state,
        list: uniqBy([
          notification,
          ...state.list
        ], 'id'),
        unreadMentionCount: newUnreadMentionCount,
        unreadNotificationCount: state.unreadNotificationCount + 1
      }
    }

    case `${READ}/${NOTIFICATION}`: {
      const notification = state.list.find(notification => notification.id === action.notificationId && !notification.read)
      if (!notification) return state
      const newUnreadMentionCount = notification.type === mentionCreated ? state.unreadMentionCount - 1 : state.unreadMentionCount
      return {
        ...state,
        list: state.list.map(no => no.id === action.notificationId ? { ...notification, read: true } : no),
        unreadMentionCount: newUnreadMentionCount,
        unreadNotificationCount: state.unreadNotificationCount - 1
      }
    }

    case `${READ}/${NOTIFICATION_LIST}`: {
      const notificationList = state.list.map(notification => (
        { ...notification, read: true }
      ))
      return { ...state, list: uniqBy(notificationList, 'id'), unreadMentionCount: 0, unreadNotificationCount: 0 }
    }

    case `${SET}/${NEXT_PAGE}`:
      return { ...state, hasNextPage: action.hasNextPage, nextPageToken: action.nextPageToken }

    case `${SET}/${UNREAD_MENTION_COUNT}`:
      return { ...state, unreadMentionCount: action.count }

    case `${SET}/${UNREAD_NOTIFICATION_COUNT}`:
      return { ...state, unreadNotificationCount: action.count }

    case `${SET}/${USER_DISCONNECTED}`:
      return defaultNotificationsObject

    default:
      return state
  }
}
