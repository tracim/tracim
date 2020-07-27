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
  created: '',
  icon: '',
  id: 0,
  read: false,
  type: '',
  url: '',
  workspace: ''
}]

export const getNotificationFromTLM = data => {
  let typeIcon, type, url

  if (!/comment/.test(data.event_type) && /content.*created/.test(data.event_type)) {
    typeIcon = 'fa-magic'
    type = 'content.created'
    url = `/ui/workspaces/${data.fields.workspace.workspace_id}/contents/${data.fields.content.content_type}/${data.fields.content.content_id}`
  } else if (/content.*modified/.test(data.event_type)) {
    if (data.fields.content.current_revision_type === 'status-update') {
      typeIcon = 'fa-random'
      type = 'status.modified'
    } else {
      typeIcon = 'fa-history'
      type = 'content.modified'
    }
    url = `/ui/workspaces/${data.fields.workspace.workspace_id}/contents/${data.fields.content.content_type}/${data.fields.content.content_id}`
  } else if (data.event_type === 'workspace_member.created') {
    typeIcon = 'fa-user-o'
    type = 'member.created'
    url = `/ui/workspaces/${data.fields.workspace.workspace_id}/dashboard`
  } else return null

  return {
    author: data.fields.author.public_name,
    content: data.fields.content ? data.fields.content.label : '',
    created: data.created,
    icon: typeIcon,
    id: data.event_id,
    read: data.read,
    type: type,
    url: url,
    workspace: data.fields.workspace.label
  }
}

export default function notificationList (state = defaultNotificationList, action) {
  switch (action.type) {
    case `${SET}/${NOTIFICATION_LIST}`: {
      const notificationList = action.notificationList
        .map(no => getNotificationFromTLM(no))
        .filter(no => no !== null)
        .reverse()
      return uniqBy(notificationList, 'id')
    }

    case `${ADD}/${NOTIFICATION}`: {
      return uniqBy([getNotificationFromTLM(action.notification), ...state], 'id')
    }

    case `${UPDATE}/${NOTIFICATION}`:
      return state.map(no => no.id === action.notification.id ? action.notification : no)

    default:
      return state
  }
}
