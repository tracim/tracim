import { uniqBy } from 'lodash'
import {
  ADD,
  NOTIFICATION_LIST,
  SET
} from '../action-creator.sync.js'

const defaultNotificationList = [{
  url: 0,
  id: 0,
  icon: '',
  read: false,
  text: ''
}]

const getNotificationFromTLM = (eventData, contentData) => {
  let typeIcon, typeText, url

  if (/content.*created/.test(eventData.event_type)) {
    typeIcon = 'fa-magic'
    typeText = `${contentData.author.public_name} created ${contentData.content.label} at ${contentData.workspace.slug}`
    url = `/ui/workspaces/${contentData.workspace.workspace_id}/contents/${contentData.content.content_type}/${contentData.content.content_id}`
  } else if (/content.*modified/.test(eventData.event_type)) {
    typeIcon = 'fa-history'
    typeText = `${contentData.author.public_name} updated ${contentData.content.label} at ${contentData.workspace.slug}`
    url = `/ui/workspaces/${contentData.workspace.workspace_id}/contents/${contentData.content.content_type}/${contentData.content.content_id}`
  } else if (/workspace_member.*created/.test(eventData.event_type)) {
    typeIcon = 'fa-user-o'
    typeText = `${contentData.author.public_name} added you to ${contentData.workspace.slug}`
    url = `/ui/workspaces/${contentData.workspace.workspace_id}/dashboard`
  }

  return {
    url: url,
    id: eventData.event_id,
    icon: typeIcon,
    read: eventData.read,
    text: typeText
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

    case `${ADD}/${NOTIFICATION_LIST}`: {
      // INFO - 2020-07-22 - GB - The event and the content data are in the same place, that's why we send the same constant
      return uniqBy([getNotificationFromTLM(action.notification, action.notification), ...state], 'id')
    }

    default:
      return state
  }
}
