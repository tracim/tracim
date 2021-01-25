import { uniqBy } from 'lodash'
import {
  ADD,
  APPEND,
  NEXT_PAGE,
  NOTIFICATION,
  NOTIFICATION_LIST,
  SET,
  READ,
  NOTIFICATION_NOT_READ_COUNT,
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
  notificationNotReadCount: 0
}

// FIXME - GB - 2020-07-30 - We can't use the global serializer in this case because it doesn't handle nested object
// See https://github.com/tracim/tracim/issues/3229
export const serializeNotification = notification => {
  return {
    author: {
      publicName: notification.fields.author.public_name,
      userId: notification.fields.author.user_id,
      hasAvatar: notification.fields.author.has_avatar,
      hasCover: notification.fields.author.has_cover,
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

export default function notificationPage (state = defaultNotificationsObject, action) {
  switch (action.type) {
    case `${SET}/${NOTIFICATION_LIST}`: {
      const notificationList = action.notificationList
        .map(no => (serializeNotification(no)))
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
      return {
        ...state,
        list: uniqBy([
          serializeNotification(action.notification),
          ...state.list
        ], 'id'),
        notificationNotReadCount: state.notificationNotReadCount + 1
      }
    }

    case `${READ}/${NOTIFICATION}`: {
      const notification = state.list.find(notification => notification.id === action.notificationId && !notification.read)
      if (!notification) return state
      return {
        ...state,
        list: state.list.map(no => no.id === action.notificationId ? { ...notification, read: true } : no),
        notificationNotReadCount: state.notificationNotReadCount - 1
      }
    }

    case `${READ}/${NOTIFICATION_LIST}`: {
      const notificationList = state.list.map(notification => (
        { ...notification, read: true }
      ))
      return { ...state, list: uniqBy(notificationList, 'id'), notificationNotReadCount: 0 }
    }

    case `${SET}/${NEXT_PAGE}`:
      return { ...state, hasNextPage: action.hasNextPage, nextPageToken: action.nextPageToken }

    case `${SET}/${NOTIFICATION_NOT_READ_COUNT}`:
      return { ...state, notificationNotReadCount: action.notificationNotReadCount }

    case `${SET}/${USER_DISCONNECTED}`:
      return defaultNotificationsObject

    default:
      return state
  }
}
