import { uniqBy } from 'lodash'
import {
  ADD_NOTIFICATION,
  APPEND_NOTIFICATION_LIST,
  CONTENT,
  EVERY_NOTIFICATION,
  NEXT_PAGE,
  NOTIFICATION,
  NOTIFICATION_LIST,
  READ,
  SET,
  UNREAD_MENTION_COUNT,
  UNREAD_NOTIFICATION_COUNT,
  UPDATE,
  UPDATE_NOTIFICATION_LIST,
  USER_DISCONNECTED
} from '../action-creator.sync.js'
import { serializeContentProps } from './workspaceContentList.js'
import { serializeWorkspaceListProps } from './workspaceList.js'
import { serializeUserProps } from './user.js'
import {
  CONTENT_TYPE,
  serialize,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  shouldKeepNotification
} from 'tracim_frontend_lib'

const defaultNotificationsObject = {
  list: [],
  rawList: [],
  hasNextPage: false,
  nextPageToken: '',
  unreadMentionCount: 0,
  unreadNotificationCount: 0
}

const userIdIfFiltered = -1

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
    subscription: notification.fields.subscription
      ? {
        ...notification.fields.subscription,
        author: serialize(notification.fields.subscription.author, serializeUserProps)
      }
      : null,
    content: notification.fields.content
      ? {
        parentLabel: notification.fields.content.parent
          ? notification.fields.content.parent.label
          : null,
        parentId: notification.fields.content.parent
          ? notification.fields.content.parent.content_id
          : null,
        assignee: notification.fields.content.assignee
          ? serialize(notification.fields.content.assignee, serializeUserProps)
          : null,
        ...serialize(notification.fields.content, serializeContentProps)
      }
      : null,
    mention: notification.fields.mention
      ? {
        contentId: notification.fields.mention.content_id,
        recipient: notification.fields.mention.recipient,
        type: notification.fields.mention.type
      }
      : null,
    created: notification.created,
    id: notification.event_id,
    read: notification.read,
    type: notification.event_type,
    workspace: notification.fields.workspace
      ? serialize(notification.fields.workspace, serializeWorkspaceListProps)
      : null
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

/**
 * FIXME - GB - 2022-04-21 - This code is very similar to activityDisplayFilter
 * in withActivity and ActivityList, and can be refactor
 * See https://github.com/tracim/tracim/issues/4677
 * FIXME - MP - 2022-10-18 - This function allows us to filter when loading more notifications.
 * However there is a similar logic in ReduxTlmDispatcher.js when we receive a TLM.
 * https://github.com/tracim/tracim/issues/5946
 *
 * Filter the notification list according to theses filters:
 * - userId for todo notifications
 * - spaceList for access request notifications
 * @param {int} userId Filter the notification list to not display todos notifications if we are not
 *  assigned to the todo. `userIdIfFiltered` if the list is already filtered
 * @param {userConfig} userConfig filter notification from spaces user is unsubscribed
 * @param {Object[]} notificationList Notification list to filter
 * @param {Object[]} spaceList Filter the notification to not display access request to spaces that
 *  are not in the list
 * @param {int} unreadNotificationCount The current unread notification count
 * @param {int} unreadMentionCount The current unread mention count
 * @returns {Object} An object that contains the new notification list filtered and the new unread
 * notification count
 */
function notificationListFilter (
  userId, userConfig, notificationList, spaceList, unreadNotificationCount, unreadMentionCount
) {
  let newUnreadNotificationCount = unreadNotificationCount
  let newUnreadMentionCount = unreadMentionCount
  const newNotificationList = notificationList.filter(notification => {
    const [entityType, coreType, subType] = notification.type.split('.') // eslint-disable-line no-unused-vars

    // INFO - MP - 2022-10-18 - Since we are filtering twice, the userId verification is if we are
    // doing this function in the `addNotification` case, which in this case is already filtered
    if (
      userId !== userIdIfFiltered &&
      entityType === TLM_ET.CONTENT && subType === TLM_ST.TODO &&
      notification.content.assignee.userId !== userId
    ) {
      if (!notification.read) newUnreadNotificationCount--
      return false
    }

    if (
      (
        entityType === TLM_ET.SHAREDSPACE_MEMBER ||
        entityType === TLM_ET.SHAREDSPACE_SUBSCRIPTION
      ) &&
      !(spaceList.find(space => space.id === notification.workspace.id))
    ) {
      if (!notification.read) newUnreadNotificationCount--
      return false
    }

    // INFO - CH - 2024-06-19 - filter notification from spaces user is not subscribed
    const shouldKeep = shouldKeepNotification(notification, userConfig)
    if (shouldKeep === false) {
      if (!notification.read) {
        if (notification.type === `${TLM_ET.MENTION}.${TLM_CET.CREATED}`) newUnreadMentionCount--
        newUnreadNotificationCount--
      }
      return false
    }

    return true
  })

  return {
    rawList: notificationList,
    list: newNotificationList,
    unreadNotificationCount: newUnreadNotificationCount,
    unreadMentionCount: newUnreadMentionCount
  }
}

export default function notificationPage (state = defaultNotificationsObject, action) {
  switch (action.type) {
    case APPEND_NOTIFICATION_LIST: {
      const notificationList = action.notificationList
        .map(notification => serializeNotification(notification))
      return {
        ...state,
        ...notificationListFilter(
          action.userId,
          action.userConfig,
          [...state.rawList, ...notificationList],
          action.spaceList,
          state.unreadNotificationCount,
          state.unreadMentionCount
        )
      }
    }

    case ADD_NOTIFICATION: {
      const notification = serializeNotification(action.notification)

      const shouldKeep = shouldKeepNotification(notification, action.userConfig)
      if (shouldKeep === false) return state

      const newUnreadMentionCount = notification.type === `${TLM_ET.MENTION}.${TLM_CET.CREATED}`
        ? state.unreadMentionCount + 1
        : state.unreadMentionCount

      return {
        ...state,
        // FIXME - MP - 2022-10-18 - Remove the function here to keep the logic in
        // ReduxTlmDispatcher.jsx
        // https://github.com/tracim/tracim/issues/5946
        ...notificationListFilter(
          userIdIfFiltered,
          action.userConfig,
          sortByCreatedDate([...state.rawList, notification]),
          action.spaceList,
          state.unreadNotificationCount + 1,
          newUnreadMentionCount
        )
      }
    }

    // FIXME - M.L - 2024-06-26 - This is not used anymore (except in tests), must be removed
    //  https://github.com/tracim/tracim/issues/6537
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

    case `${READ}/${NOTIFICATION_LIST}`: {
      const notificationList = state.rawList.filter(
        n => !n.read && action.notificationIdList.includes(n.id)
      )

      if (notificationList.length === 0) return state

      const replaceList = state.list.map(
        n => action.notificationIdList.includes(n.id) ? { ...n, read: true } : n
      )

      const replaceRawList = state.rawList.map(
        n => action.notificationIdList.includes(n.id) ? { ...n, read: true } : n
      )

      const newUnreadMentionCount = state.unreadMentionCount - notificationList
        .filter(n => n.type === `${TLM_ET.MENTION}.${TLM_CET.CREATED}`)
        .length

      const newUnreadNotificationCount = state.unreadNotificationCount - notificationList.length

      return {
        ...state,
        list: replaceList,
        rawList: replaceRawList,
        unreadMentionCount: newUnreadMentionCount,
        unreadNotificationCount: newUnreadNotificationCount
      }
    }

    case `${READ}/${EVERY_NOTIFICATION}`: {
      const notificationList = state.list.map(notification => ({ ...notification, read: true }))
      const notificationRawList = state.rawList.map(notification => ({ ...notification, read: true }))
      return {
        ...state,
        list: uniqBy(notificationList, 'id'),
        rawList: uniqBy(notificationRawList, 'id'),
        unreadMentionCount: 0,
        unreadNotificationCount: 0
      }
    }

    case `${READ}/${CONTENT}/${NOTIFICATION}`: {
      let unreadMentionCount = state.unreadMentionCount
      let unreadNotificationCount = state.unreadNotificationCount
      // FIXME - M.L - 2024-06-26 - Decrement is a workaround, better solution will be implemented
      //  https://github.com/tracim/tracim/issues/6537
      const markNotificationAsRead = (notification, decrement) => {
        if (!notification.content) return notification
        if (getMainContentId(notification) === action.contentId) {
          if (!notification.read && decrement) {
            if (notification.type.includes(TLM_ET.MENTION)) unreadMentionCount--
            unreadNotificationCount--
          }
          return { ...notification, read: true }
        }
        return notification
      }

      const newNotificationList = state.list.map(notification => {
        return markNotificationAsRead(notification, true)
      })

      const newNotificationRawList = state.rawList.map(notification => {
        return markNotificationAsRead(notification, false)
      })

      return {
        ...state,
        list: uniqBy(newNotificationList, 'id'),
        rawList: uniqBy(newNotificationRawList, 'id'),
        unreadMentionCount,
        unreadNotificationCount
      }
    }

    case UPDATE_NOTIFICATION_LIST:
      return {
        ...state,
        ...notificationListFilter(
          action.userId,
          action.userConfig,
          [...state.rawList],
          action.spaceList,
          state.unreadNotificationCount,
          state.unreadMentionCount
        )
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
