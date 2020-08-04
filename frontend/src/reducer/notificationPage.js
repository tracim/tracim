import { uniqBy } from 'lodash'
import {
  ADD,
  APPEND,
  NEXT_PAGE,
  NOTIFICATION,
  NOTIFICATION_LIST,
  SET,
  READ,
  NOTIFICATION_NOT_READ_COUNT
} from '../action-creator.sync.js'

const defaultNotificationsObject = {
  list: [],
  hasNextPage: false,
  nextPageToken: '',
  notificationNotReadCount: 0
}

// FIXME - GB - 2020-07-30 - We can't use the global serializer in this case because it doesn't handle nested object
// See https://github.com/tracim/tracim/issues/3229
export const serializeNotification = no => {
  return {
    author: no.fields.author.public_name,
    user: no.fields.user ? no.fields.user : null,
    content: no.fields.content ? no.fields.content : null,
    created: no.created,
    id: no.event_id,
    read: no.read,
    type: no.event_type,
    workspace: no.fields.workspace ? no.fields.workspace : null
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
        .map(no => (serializeNotification(no)))
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
      if (!notification) return
      return {
        ...state,
        list: state.list.map(no => no.id === action.notificationId ? { ...notification, read: true } : no),
        notificationNotReadCount: state.notificationNotReadCount - 1
      }
    }

    case `${SET}/${NEXT_PAGE}`:
      return { ...state, hasNextPage: action.hasNextPage, nextPageToken: action.nextPageToken }

    case `${SET}/${NOTIFICATION_NOT_READ_COUNT}`:
      return { ...state, notificationNotReadCount: action.notificationNotReadCount }

    default:
      return state
  }
}
