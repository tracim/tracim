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

const belongsToGroup = (notification, groupedNotification, numberOfCriteria = 2) => {
  if (!groupedNotification.group) return false

  const isGroupedByContent = groupedNotification.type.includes('content') &&
    hasSameContent([notification, groupedNotification])

  const isGroupedByWorkspace = groupedNotification.type.includes('workspace') &&
    hasSameWorkspace([notification.workspace, groupedNotification.group[0].workspace])

  const isGroupedByAuthor = groupedNotification.type.includes('author') &&
    hasSameAuthor([notification.author, groupedNotification.group[0].author])

  if ((numberOfCriteria === 2 &&
    (isGroupedByContent ? (isGroupedByAuthor || isGroupedByWorkspace) : (isGroupedByAuthor && isGroupedByWorkspace))) ||
    (numberOfCriteria === 1 && (isGroupedByContent || isGroupedByAuthor || isGroupedByWorkspace))
  ) {
    groupedNotification.group.push(notification)
    groupedNotification.type =
      `${numberOfCriteria === 2 ? 'twoCriteriaGroup' : 'oneCriteriaGroup'}${isGroupedByContent ? '.content' : ''}${isGroupedByAuthor ? '.author' : ''}${isGroupedByWorkspace ? '.workspace' : ''}`
    return true
  }
}

const groupNotificationListWithTwoCriteria = (notificationList) => {
  const numberOfNotificationsToGroup = 3
  const newNotificationList = []
  let indexInNewList = 0

  notificationList.forEach((notification, index) => {
    if (index < (numberOfNotificationsToGroup - 1) || notification.type.includes('mention')) {
      indexInNewList++
      newNotificationList.push(notification)
      return
    }

    const previousNotificationInNewList = newNotificationList[indexInNewList - 1]
    if (belongsToGroup(notification, previousNotificationInNewList, 2)) return
    else {
      if (
        indexInNewList >= (numberOfNotificationsToGroup - 1) &&
        !newNotificationList
          .slice(indexInNewList - (numberOfNotificationsToGroup - 1), indexInNewList - 1)
          .some(notification => notification.group)
      ) {
        const previousNotificationList = newNotificationList
          .slice(indexInNewList - (numberOfNotificationsToGroup - 1), indexInNewList)
        const isGroupedByAuthor = hasSameAuthor([notification.author, ...previousNotificationList.map(notification => notification.author)])
        const isGroupedByWorkspace = hasSameWorkspace([notification.workspace, ...previousNotificationList.map(notification => notification.workspace)])
        const isGroupedByContent = hasSameContent([notification, ...previousNotificationList])
        if (
          isGroupedByContent ? (isGroupedByAuthor || isGroupedByWorkspace) : (isGroupedByAuthor && isGroupedByWorkspace) &&
            (!previousNotificationList.some(notification => notification.type.includes('mention')))
        ) {
          const authorList = uniqBy([
            notification.author,
            ...previousNotificationList.map(notification => notification.author)
          ], 'userId')

          for (let i = 0; i < (numberOfNotificationsToGroup - 1); i++) newNotificationList.pop()

          newNotificationList.push({
            author: authorList,
            id: notification.id,
            type: `twoCriteriaGroup${isGroupedByContent ? '.content' : ''}${isGroupedByAuthor ? '.author' : ''}${isGroupedByWorkspace ? '.workspace' : ''}`,
            group: [notification, ...previousNotificationList]
          })
          indexInNewList = indexInNewList - (numberOfNotificationsToGroup - 2)
          return
        }
      }
    }

    indexInNewList++
    newNotificationList.push(notification)
  })
  return groupNotificationListWithOneCriteria(newNotificationList)
}

const groupNotificationListWithOneCriteria = (notificationList) => {
  const numberOfNotificationsToGroup = 6
  const newNotificationList = []
  let indexInNewList = 0

  notificationList.forEach((notification, index) => {
    if (index < numberOfNotificationsToGroup - 1 || notification.type.includes('mention') || notification.group) {
      indexInNewList++
      newNotificationList.push(notification)
      return
    }

    const previousNotificationInNewList = newNotificationList[indexInNewList - 1]

    if (previousNotificationInNewList.type.startsWith('twoCriteriaGroup')) {
      indexInNewList++
      newNotificationList.push(notification)
      return
    }
    if (belongsToGroup(notification, previousNotificationInNewList, 1)) return
    else {
      if (
        indexInNewList >= (numberOfNotificationsToGroup - 1) &&
        !newNotificationList
          .slice(indexInNewList - (numberOfNotificationsToGroup - 1), indexInNewList - 1)
          .some(notification => notification.group)
      ) {
        const previousNotificationList = newNotificationList
          .slice(indexInNewList - (numberOfNotificationsToGroup - 1), indexInNewList)
        const isGroupedByAuthor = hasSameAuthor([notification.author, ...previousNotificationList.map(notification => notification.author)])
        const isGroupedByWorkspace = hasSameWorkspace([notification.workspace, ...previousNotificationList.map(notification => notification.workspace)])
        const isGroupedByContent = hasSameContent([notification, ...previousNotificationList])

        if (
          (isGroupedByContent || isGroupedByAuthor || isGroupedByWorkspace) &&
          (!previousNotificationList.some(notification => notification.type.includes('mention')))
        ) {
          const authorList = uniqBy([
            notification.author,
            ...previousNotificationList.map(notification => notification.author)
          ], 'userId')

          for (let i = 0; i < (numberOfNotificationsToGroup - 1); i++) newNotificationList.pop()

          newNotificationList.push({
            author: authorList,
            id: notification.id,
            type: `oneCriteriaGroup${isGroupedByContent ? '.content' : ''}${isGroupedByAuthor ? '.author' : ''}${isGroupedByWorkspace ? '.workspace' : ''}`,
            group: [notification, ...previousNotificationList]
          })
          indexInNewList = indexInNewList - (numberOfNotificationsToGroup - 2)
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
        .map(notification => (serializeNotification(notification)))
      const groupedNotificationList = groupNotificationListWithTwoCriteria(uniqBy(notificationList, 'id'))
      return { ...state, list: groupedNotificationList }
    }

    case `${APPEND}/${NOTIFICATION_LIST}`: {
      const notificationList = action.notificationList
        .map(notification => (serializeNotification(notification)))
      const groupedNotificationList = groupNotificationListWithTwoCriteria(uniqBy(notificationList, 'id'))
      return {
        ...state,
        list: [...state.list, ...groupedNotificationList]
      }
    }

    case `${ADD}/${NOTIFICATION}`: {
      const notification = serializeNotification(action.notification)
      const newUnreadMentionCount = notification.type === mentionCreated ? state.unreadMentionCount + 1 : state.unreadMentionCount
      let newNotificationList = state.list
      if (!belongsToGroup(notification, newNotificationList[0], 2)) {
        if (!belongsToGroup(notification, newNotificationList[0], 1)) {
          newNotificationList = groupNotificationListWithTwoCriteria(uniqBy([notification, ...state.list], 'id'))
        }
      }

      return {
        ...state,
        list: newNotificationList,
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
