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

export default function notificationList (state = defaultNotificationsObject, action) {
  switch (action.type) {
    case `${SET}/${NOTIFICATION_LIST}`: {
      const notificationList = action.notificationList
        .map(no => ({
          author: no.fields.author.public_name,
          content: no.fields.content ? no.fields.content : null,
          created: no.created,
          id: no.event_id,
          read: no.read,
          type: no.event_type,
          workspace: no.fields.workspace ? no.fields.workspace : null
        }))
      return { ...state, list: uniqBy(notificationList, 'id') }
    }

    case `${APPEND}/${NOTIFICATION_LIST}`: {
      const notificationList = action.notificationList
        .map(no => ({
          author: no.fields.author.public_name,
          content: no.fields.content ? no.fields.content : null,
          created: no.created,
          id: no.event_id,
          read: no.read,
          type: no.event_type,
          workspace: no.fields.workspace ? no.fields.workspace : null
        }))
      return {
        ...state,
        list: uniqBy([...state.list, ...notificationList], 'id')
      }
    }

    case `${ADD}/${NOTIFICATION}`: {
      return {
        ...state,
        list: uniqBy([
          {
            author: action.notification.fields.author.public_name,
            content: action.notification.fields.content ? action.notification.fields.content : null,
            created: action.notification.created,
            id: action.notification.event_id,
            read: action.notification.read,
            type: action.notification.event_type,
            workspace: action.notification.fields.workspace ? action.notification.fields.workspace : null
          },
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
