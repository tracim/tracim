import { uniqBy } from 'lodash'
import {
  ADD,
  NOTIFICATION_LIST,
  SET,
  UPDATE,
  WORKSPACE_CONTENT,
  WORKSPACE_MEMBER
} from '../action-creator.sync.js'

const defaultNotificationList = [{
  contentId: 0,
  id: 0,
  icon: '',
  read: false,
  text: ''
}]

const getNotificationFromTLM = (eventData, contentData) => {
  let typeIcon, typeText, contentId

  if (/content.*created/.test(eventData.event_type)){
    typeIcon = 'fa-magic'
    typeText = `${contentData.author.public_name} created ${contentData.content.label} at ${contentData.workspace.slug}`
    contentId = contentData.content.content_id
  }

  if (/content.*modified/.test(eventData.event_type)){
    typeIcon = 'fa-history'
    typeText = `${contentData.author.public_name} updated ${contentData.content.label} at ${contentData.workspace.slug}`
    contentId = contentData.content.content_id
  }

  if (/workspace_member.*created/.test(eventData.event_type)){
    typeIcon = 'fa-user-o'
    typeText = `${contentData.author.public_name} added you to ${contentData.workspace.slug}`
    contentId = contentData.workspace.workspace_id
  }

  return {
    contentId: contentId,
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
        .filter(no => /content.*created/.test(no.event_type) || /content.*modified/.test(no.event_type) || /workspace_member.*created/.test(no.event_type))
        .map(no => getNotificationFromTLM(no, no.fields))
      return notificationList
    }

    case `${ADD}/${NOTIFICATION_LIST}`: {
      // INFO - 2020-07-22 - GB - The event and the content data are in the same place, that's why we send the same constant
      return [...state, getNotificationFromTLM(action.notification, action.notification)]
    }

    default:
      return state
  }
}
