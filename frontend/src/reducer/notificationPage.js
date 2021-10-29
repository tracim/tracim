import { uniqBy, cloneDeep } from 'lodash'
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
import { GROUP_NOTIFICATION_CRITERIA } from '../util/helper.js'
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

const NUMBER_OF_CRITERIA = {
  ONE: 1,
  TWO: 2
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

export function sortByCreatedDate (arrayToSort) {
  return arrayToSort.sort(function (a, b) {
    if (a.created < b.created) return 1
    if (a.created > b.created) return -1
    return 0
  })
}

export const hasSameAuthor = authorList => {
  return !authorList.some((author, index) => {
    return !author || (index && author.userId !== authorList[index - 1].userId)
  })
}

export const hasSameWorkspace = workspaceList => {
  return !workspaceList.some((workspace, index) => {
    return !workspace || (index && workspace.id !== workspaceList[index - 1].id)
  })
}

export const hasSameContent = notificationList => {
  if (notificationList.some(notification => !notification.content)) return false
  return notificationList.every((notification, index) => {
    if (index === 0) return true
    return getMainContentId(notification) === getMainContentId(notificationList[index - 1])
  })
}

const addNewNotificationGroup = (notification, newNotificationList, indexInNewList, numberOfNotificationsToGroup, numberOfCriteria = NUMBER_OF_CRITERIA.TWO) => {
  if (
    indexInNewList >= (numberOfNotificationsToGroup - 1) &&
    !newNotificationList
      .slice(indexInNewList - (numberOfNotificationsToGroup - 1), indexInNewList)
      .some(notification => notification.group)
  ) {
    const previousNotificationList = newNotificationList
      .slice(indexInNewList - (numberOfNotificationsToGroup - 1), indexInNewList)
    const isGroupedByAuthor = hasSameAuthor([notification.author, ...previousNotificationList.map(notification => notification.author)])
    const isGroupedByWorkspace = hasSameWorkspace([notification.workspace, ...previousNotificationList.map(notification => notification.workspace)])
    const isGroupedByContent = hasSameContent([notification, ...previousNotificationList])

    if (
      ((numberOfCriteria === NUMBER_OF_CRITERIA.TWO &&
        (isGroupedByContent ? (isGroupedByAuthor || isGroupedByWorkspace) : (isGroupedByAuthor && isGroupedByWorkspace))) ||
        (numberOfCriteria === NUMBER_OF_CRITERIA.ONE && (isGroupedByContent || isGroupedByAuthor || isGroupedByWorkspace))
      ) &&
      (!previousNotificationList.some(notification => notification.type.includes(TLM_ET.MENTION)))
    ) {
      const authorList = uniqBy([
        notification.author,
        ...previousNotificationList.map(notification => notification.author)
      ], 'userId')

      for (let i = 0; i < (numberOfNotificationsToGroup - 1); i++) newNotificationList.pop()
      const notificationGroupList = sortByCreatedDate([notification, ...previousNotificationList])

      newNotificationList.push({
        author: authorList,
        created: notificationGroupList[0].created,
        id: notification.id,
        type: `${numberOfCriteria}${isGroupedByContent ? `.${GROUP_NOTIFICATION_CRITERIA.CONTENT}` : ''}${isGroupedByAuthor ? `.${GROUP_NOTIFICATION_CRITERIA.AUTHOR}` : ''}${isGroupedByWorkspace ? `.${GROUP_NOTIFICATION_CRITERIA.WORKSPACE}` : ''}`,
        group: notificationGroupList
      })
    }
  }
}

export const belongsToGroup = (notification, groupedNotification, numberOfCriteria = NUMBER_OF_CRITERIA.TWO) => {
  if (!groupedNotification || !groupedNotification.group) return false

  const isGroupedByContent = groupedNotification.type.includes(GROUP_NOTIFICATION_CRITERIA.CONTENT) &&
    hasSameContent([notification, groupedNotification])

  const isGroupedByWorkspace = groupedNotification.type.includes(GROUP_NOTIFICATION_CRITERIA.WORKSPACE) &&
    hasSameWorkspace([notification.workspace, groupedNotification.group[0].workspace])

  const isGroupedByAuthor = groupedNotification.type.includes(GROUP_NOTIFICATION_CRITERIA.AUTHOR) &&
    hasSameAuthor([notification.author, groupedNotification.group[0].author])

  if ((numberOfCriteria === NUMBER_OF_CRITERIA.TWO &&
    (isGroupedByContent ? (isGroupedByAuthor || isGroupedByWorkspace) : (isGroupedByAuthor && isGroupedByWorkspace))) ||
    (numberOfCriteria === NUMBER_OF_CRITERIA.ONE && (isGroupedByContent || isGroupedByAuthor || isGroupedByWorkspace))
  ) {
    groupedNotification.group = sortByCreatedDate([notification, ...groupedNotification.group])
    groupedNotification.type =
      `${numberOfCriteria}${isGroupedByContent ? `.${GROUP_NOTIFICATION_CRITERIA.CONTENT}` : ''}${isGroupedByAuthor ? `.${GROUP_NOTIFICATION_CRITERIA.AUTHOR}` : ''}${isGroupedByWorkspace ? `.${GROUP_NOTIFICATION_CRITERIA.WORKSPACE}` : ''}`
    groupedNotification.created = new Date(notification.created).getTime() < new Date(groupedNotification.created).getTime()
      ? groupedNotification.created
      : notification.created
    return true
  }
}

export const groupNotificationListWithTwoCriteria = (notificationList) => {
  const numberOfNotificationsToGroup = 3
  const newNotificationList = []
  let indexInNewList = 0

  notificationList.forEach((notification, index) => {
    if (index < (numberOfNotificationsToGroup - 1) || notification.type.includes(TLM_ET.MENTION)) {
      indexInNewList++
      newNotificationList.push(notification)
      return
    }

    const previousNotificationInNewList = newNotificationList[indexInNewList - 1]
    if (belongsToGroup(notification, previousNotificationInNewList, NUMBER_OF_CRITERIA.TWO)) return
    else {
      addNewNotificationGroup(
        notification,
        newNotificationList,
        indexInNewList,
        numberOfNotificationsToGroup,
        NUMBER_OF_CRITERIA.TWO
      )
      if (newNotificationList.length !== indexInNewList) {
        indexInNewList = newNotificationList.length
        return
      }
    }

    indexInNewList++
    newNotificationList.push(notification)
  })
  return groupNotificationListWithOneCriteria(newNotificationList)
}

export const groupNotificationListWithOneCriteria = (notificationList) => {
  const numberOfNotificationsToGroup = 6
  const newNotificationList = []
  let indexInNewList = 0

  notificationList.forEach((notification, index) => {
    if (index < numberOfNotificationsToGroup - 1 || notification.type.includes(TLM_ET.MENTION) || notification.group) {
      indexInNewList++
      newNotificationList.push(notification)
      return
    }

    const previousNotificationInNewList = newNotificationList[indexInNewList - 1]

    if (previousNotificationInNewList.type.startsWith(NUMBER_OF_CRITERIA.TWO)) {
      indexInNewList++
      newNotificationList.push(notification)
      return
    }
    if (belongsToGroup(notification, previousNotificationInNewList, NUMBER_OF_CRITERIA.ONE)) return
    else {
      addNewNotificationGroup(
        notification,
        newNotificationList,
        indexInNewList,
        numberOfNotificationsToGroup,
        NUMBER_OF_CRITERIA.ONE
      )
      if (newNotificationList.length !== indexInNewList) {
        indexInNewList = newNotificationList.length
        return
      }
    }

    indexInNewList++
    newNotificationList.push(notification)
  })
  return newNotificationList
}

function getMainContentId (notification) {
  return notification.type.includes(CONTENT_TYPE.COMMENT) || notification.type.includes(TLM_ET.MENTION)
    ? notification.content.parentId
    : notification.content.id
}

export default function notificationPage (state = defaultNotificationsObject, action) {
  switch (action.type) {
    case `${SET}/${NOTIFICATION_LIST}`: {
      const notificationList = action.notificationList
        .map(notification => (serializeNotification(notification)))
      const groupedNotificationList = sortByCreatedDate(groupNotificationListWithTwoCriteria(uniqBy(notificationList, 'id')))
      return { ...state, list: groupedNotificationList }
    }

    case `${APPEND}/${NOTIFICATION_LIST}`: {
      const notificationList = action.notificationList
        .map(notification => (serializeNotification(notification)))
      const groupedNotificationList = sortByCreatedDate(groupNotificationListWithTwoCriteria(uniqBy(notificationList, 'id')))
      return {
        ...state,
        list: [...state.list, ...groupedNotificationList]
      }
    }

    case `${ADD}/${NOTIFICATION}`: {
      const notification = serializeNotification(action.notification)
      const newUnreadMentionCount = notification.type === `${TLM_ET.MENTION}.${TLM_CET.CREATED}` ? state.unreadMentionCount + 1 : state.unreadMentionCount
      let newNotificationList = cloneDeep(state.list)
      if (!belongsToGroup(notification, newNotificationList[0], NUMBER_OF_CRITERIA.TWO)) {
        if (!belongsToGroup(notification, newNotificationList[0], NUMBER_OF_CRITERIA.ONE)) {
          newNotificationList = groupNotificationListWithTwoCriteria(uniqBy([notification, ...state.list], 'id'))
        }
      }
      return {
        ...state,
        list: sortByCreatedDate(newNotificationList),
        unreadMentionCount: newUnreadMentionCount,
        unreadNotificationCount: state.unreadNotificationCount + 1
      }
    }

    case `${UPDATE}/${NOTIFICATION}`: {
      const index = state.list.findIndex(notification => notification.id === action.notificationId)
      const newNotificationList = [
        ...state.list.slice(0, index),
        ...action.notificationList,
        ...state.list.slice(index + 1, state.list.length)
      ]
      return { ...state, list: newNotificationList }
    }

    case `${READ}/${NOTIFICATION}`: {
      const notification = state.list.find(notification => notification.id === action.notificationId && !notification.read)
      if (!notification) return state
      const newUnreadMentionCount = notification.type === `${TLM_ET.MENTION}.${TLM_CET.CREATED}` ? state.unreadMentionCount - 1 : state.unreadMentionCount
      return {
        ...state,
        list: state.list.map(no => no.id === action.notificationId ? { ...notification, read: true } : no),
        unreadMentionCount: newUnreadMentionCount,
        unreadNotificationCount: state.unreadNotificationCount - 1
      }
    }

    case `${READ}/${NOTIFICATION_LIST}`: {
      const notificationList = state.list.map(notification => notification.group
        ? { ...notification, group: notification.group.map(notification => ({ ...notification, read: true })) }
        : { ...notification, read: true }
      )
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
        if (notification.group) {
          return {
            ...notification,
            group: notification.group.map(notification => markNotificationAsRead(notification))
          }
        } else return markNotificationAsRead(notification)
      })
      return { ...state, list: uniqBy(newNotificationList, 'id'), unreadMentionCount, unreadNotificationCount }
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
