import { uniqBy } from 'lodash'
import {
  ADD,
  NOTIFICATION,
  NOTIFICATION_LIST,
  SET,
  UPDATE
} from '../action-creator.sync.js'

const defaultNotificationList = [{
  author: '',
  content: '',
  icon: '',
  id: 0,
  read: false,
  type: '',
  url: 0,
  workspace: ''
}]

const getNotificationFromTLM = (eventData, contentData) => {
  let typeIcon, type, url

  if (!/comment/.test(eventData.event_type) && /content.*created/.test(eventData.event_type)) {
    typeIcon = 'fa-magic'
    type = 'content.created'
    url = `/ui/workspaces/${contentData.workspace.workspace_id}/contents/${contentData.content.content_type}/${contentData.content.content_id}`
  } else if (/content.*modified/.test(eventData.event_type)) {
    if (contentData.content.current_revision_type === 'status-update') {
      typeIcon = 'fa-random'
      type = 'status.modified'
    } else {
      typeIcon = 'fa-history'
      type = 'content.modified'
    }
    url = `/ui/workspaces/${contentData.workspace.workspace_id}/contents/${contentData.content.content_type}/${contentData.content.content_id}`
  } else if (eventData.event_type === 'workspace_member.created') {
    typeIcon = 'fa-user-o'
    type = 'member.created'
    url = `/ui/workspaces/${contentData.workspace.workspace_id}/dashboard`
  } else return null

  return {
    author: contentData.author.public_name,
    content: contentData.content ? contentData.content.label : '',
    created: eventData.created,
    icon: typeIcon,
    id: eventData.event_id,
    read: eventData.read,
    type: type,
    url: url,
    workspace: contentData.workspace.slug
  }
}

export default function notificationList (state = defaultNotificationList, action) {
  switch (action.type) {
    case `${SET}/${NOTIFICATION_LIST}`: {
      const notificationList = action.notificationList
        .map(no => getNotificationFromTLM(no, no.fields))
        .filter(no => no !== null)
        .reverse()
      return uniqBy(notificationList, 'id')
    }

    case `${ADD}/${NOTIFICATION}`: {
      // INFO - 2020-07-22 - GB - The event and the content data are in the same place, that's why we send the same constant
      return uniqBy([getNotificationFromTLM(action.notification, action.notification), ...state], 'id')
    }

    case `${UPDATE}/${NOTIFICATION}`:
      return state.map(no => no.id === action.notification.id ? action.notification : no)

    default:
      return state
  }
}
