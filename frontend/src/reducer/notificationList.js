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
  text: '',
  url: 0,
  workspace: ''
}]

const getNotificationFromTLM = (eventData, contentData) => {
  let typeIcon, typeText, url

  if (/content.*created/.test(eventData.event_type)) {
    typeIcon = 'fa-magic'
    typeText = '{{author}} created {{content}} at {{workspace}}'
    url = `/ui/workspaces/${contentData.workspace.workspace_id}/contents/${contentData.content.content_type}/${contentData.content.content_id}`
  } else if (/content.*modified/.test(eventData.event_type)) {
    if (contentData.content.current_revision_type === 'status-update') {
      typeIcon = 'fa-random'
      typeText = '{{author}} updated the status of {{content}} at {{workspace}}'
    } else {
      typeIcon = 'fa-history'
      typeText = '{{author}} updated a new version of {{content}} at {{workspace}}'
    }
    url = `/ui/workspaces/${contentData.workspace.workspace_id}/contents/${contentData.content.content_type}/${contentData.content.content_id}`
  } else if (/workspace_member.*created/.test(eventData.event_type)) {
    typeIcon = 'fa-user-o'
    typeText = '{{author}} added you to {{workspace}}'
    url = `/ui/workspaces/${contentData.workspace.workspace_id}/dashboard`
  }

  return {
    author: contentData.author.public_name,
    content: contentData.content ? contentData.content.label : '',
    icon: typeIcon,
    id: eventData.event_id,
    read: eventData.read,
    text: typeText,
    url: url,
    workspace: contentData.workspace.slug
  }
}

export default function notificationList (state = defaultNotificationList, action) {
  switch (action.type) {
    case `${SET}/${NOTIFICATION_LIST}`: {
      const notificationList = action.notificationList
        .filter(no => !/comment/.test(no.event_type) && /(content.*created)|(content.*modified)|(workspace_member.*created)/.test(no.event_type))
        .reverse()
        .map(no => getNotificationFromTLM(no, no.fields))
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
