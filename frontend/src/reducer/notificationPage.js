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

const hasSameAuthor = authorList => {
  if (authorList.some(author => !author)) return false
  return authorList.every((author, index) => {
    if (index === 0) return true
    return author.userId === authorList[index - 1].userId
  })
}

const hasSameWorkspace = workspaceList => {
  if (workspaceList.some(workspace => !workspace)) return false
  return workspaceList.every((workspace, index) => {
    if (index === 0) return true
    return workspace.id === workspaceList[index - 1].id
  })
}

const hasSameContent = notificationList => {
  if (notificationList.some(notification => !notification.content)) return false
  return notificationList.every((notification, index) => {
    if (index === 0) return true
    const previousContentId = notificationList[index - 1].type.includes('comment')
      ? notificationList[index - 1].content.parentId
      : notificationList[index - 1].content.id
    const contentId = notification.type.includes('comment')
      ? notification.content.parentId
      : notification.content.id
    return contentId === previousContentId
  })
}

const groupNotificationListWithTwoCriteria = (notificationList) => {
  const newNotificationList = []
  let indexInNewList = 0

  notificationList.forEach((notification, index) => {
    if (index < 2 || notification.type.includes('mention')) {
      indexInNewList++
      newNotificationList.push(notification)
      return
    }

    const previousNotificationInNewList = newNotificationList[indexInNewList - 1]

    if (previousNotificationInNewList.groupType) {
      const isGroupedByContent = previousNotificationInNewList.groupType.includes('content') &&
        hasSameContent([notification, previousNotificationInNewList])

      const isGroupedByWorkspace = previousNotificationInNewList.groupType.includes('workspace') &&
        hasSameWorkspace([notification.workspace, previousNotificationInNewList.workspace])

      const isGroupedByAuthor = previousNotificationInNewList.groupType.includes('author') &&
        hasSameAuthor([notification.author, previousNotificationInNewList.author])

      if (isGroupedByContent ? (isGroupedByAuthor || isGroupedByWorkspace) : (isGroupedByAuthor && isGroupedByWorkspace)) {
        previousNotificationInNewList.group.push(notification)
        return
      }
    } else {
      if (!newNotificationList[indexInNewList - 2].groupType) {
        const previousNotification = notificationList[index - 1]
        const beforePreviousNotification = notificationList[index - 2]

        const isGroupedByAuthor = hasSameAuthor([notification.author, previousNotification.author, beforePreviousNotification.author])
        const isGroupedByWorkspace = hasSameWorkspace([notification.workspace, previousNotification.workspace, beforePreviousNotification.workspace])
        const isGroupedByContent = hasSameContent([notification, previousNotification, beforePreviousNotification])

        if (
          isGroupedByContent ? (isGroupedByAuthor || isGroupedByWorkspace) : (isGroupedByAuthor && isGroupedByWorkspace) &&
            (!previousNotification.type.includes('mention') && !beforePreviousNotification.type.includes('mention'))
        ) {
          newNotificationList.pop()
          newNotificationList.pop()
          newNotificationList.push({
            ...notification,
            read: beforePreviousNotification.read && previousNotification.read && notification.read,
            groupType: `twoCriteriaGroup${isGroupedByContent ? '.content' : ''}${isGroupedByAuthor ? '.author' : ''}${isGroupedByWorkspace ? '.workspace' : ''}`,
            group: [beforePreviousNotification, previousNotification, notification]
          })
          indexInNewList--
          return
        }
      }
    }

    indexInNewList++
    newNotificationList.push(notification)
  })
  console.log(groupNotificationListWithOneCriteria(newNotificationList))
}

const groupNotificationListWithOneCriteria = (notificationList) => {
  const newNotificationList = []
  let indexInNewList = 0
  // debugger
  notificationList.forEach((notification, index) => {
    if (index < 5 || notification.type.includes('mention')) {
      indexInNewList++
      newNotificationList.push(notification)
      return
    }

    const previousNotificationInNewList = newNotificationList[indexInNewList - 1]

    if (previousNotificationInNewList.groupType) {
      if (previousNotificationInNewList.groupType.startsWith('twoCriteriaGroup')) {
        indexInNewList++
        newNotificationList.push(notification)
      } else {
        const isGroupedByContent = previousNotificationInNewList.groupType.includes('content') &&
          hasSameContent([notification, previousNotificationInNewList])

        const isGroupedByWorkspace = previousNotificationInNewList.groupType.includes('workspace') &&
          hasSameWorkspace([notification.workspace, previousNotificationInNewList.workspace])

        const isGroupedByAuthor = previousNotificationInNewList.groupType.includes('author') &&
          hasSameAuthor([notification.author, previousNotificationInNewList.author])

        if (isGroupedByContent || isGroupedByAuthor || isGroupedByWorkspace) {
          previousNotificationInNewList.group.push(notification)
          return
        }
      }
    } else {
      if (!newNotificationList.slice(index - 5, index - 1).some(notification => notification.groupType)) {
        const previousNotificationList = newNotificationList.slice(index - 5, index)
        const isGroupedByAuthor = hasSameAuthor([notification.author, ...previousNotificationList.map(notification => notification.author)])
        const isGroupedByWorkspace = hasSameWorkspace([notification.workspace, ...previousNotificationList.map(notification => notification.workspace)])
        const isGroupedByContent = hasSameContent([notification, ...previousNotificationList])

        if (
          (isGroupedByContent || isGroupedByAuthor || isGroupedByWorkspace) &&
          (!previousNotificationList.some(notification => notification.type.includes('mention')))
        ) {
          newNotificationList.pop()
          newNotificationList.pop()
          newNotificationList.pop()
          newNotificationList.pop()
          newNotificationList.pop()
          newNotificationList.push({
            ...notification,
            groupType: `oneCriteriaGroup${isGroupedByContent ? '.content' : ''}${isGroupedByAuthor ? '.author' : ''}${isGroupedByWorkspace ? '.workspace' : ''}`,
            group: [notification, ...previousNotificationList]
          })
          indexInNewList = indexInNewList - 4
          return
        }
      }
    }

    indexInNewList++
    newNotificationList.push(notification)
  })
  return newNotificationList
}

export default function notificationPage (state = defaultNotificationsObject, action) {
  const mentionCreated = 'mention.created'
  switch (action.type) {
    case `${SET}/${NOTIFICATION_LIST}`: {
      const notificationList = action.notificationList
        .map(no => (serializeNotification(no)))
      groupNotificationListWithTwoCriteria(notificationList)
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
