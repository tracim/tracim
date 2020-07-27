import { uniqBy } from 'lodash'
import {
  ADD,
  NOTIFICATION,
  NOTIFICATION_LIST,
  SET,
  UPDATE
} from '../action-creator.sync.js'

const defaultNotificationList = []

export default function notificationList (state = defaultNotificationList, action) {
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
        .reverse()
      return uniqBy(notificationList, 'id')
    }

    case `${ADD}/${NOTIFICATION}`: {
      return uniqBy([
        {
          author: action.notification.fields.author.public_name,
          content: action.notification.fields.content ? action.notification.fields.content : null,
          created: action.notification.created,
          id: action.notification.event_id,
          read: action.notification.read,
          type: action.notification.event_type,
          workspace: action.notification.fields.workspace ? action.notification.fields.workspace : null
        },
        ...state
      ], 'id')
    }

    case `${UPDATE}/${NOTIFICATION}`:
      return state.map(no => no.id === action.notification.id ? action.notification : no)

    default:
      return state
  }
}
