import { uniqBy } from 'lodash'
import {
  ADD,
  APPEND,
  NEXT_PAGE,
  NOTIFICATION,
  NOTIFICATION_LIST,
  SET,
  UPDATE
} from '../action-creator.sync.js'

const defaultNotificationsObject = {
  list: [],
  hasNextPage: false,
  nextPageToken: ''
}

// FIXME - GB - 2020-07-30 - We can't use the global serializer in this case because it doesn't handle nested object
// See https://github.com/tracim/tracim/issues/3229
export const serializeNotification = no => {
  return {
    author: no.fields.author.public_name,
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
        ], 'id')
      }
    }

    case `${UPDATE}/${NOTIFICATION}`:
      return { ...state, list: state.list.map(no => no.id === action.notification.id ? action.notification : no) }

    case `${SET}/${NEXT_PAGE}`:
      return { ...state, hasNextPage: action.hasNextPage, nextPageToken: action.nextPageToken }

    default:
      return state
  }
}
