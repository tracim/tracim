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
  icon: '',
  text: '',
  read: false
}]


export default function notificationList (state = defaultNotificationList, action) {
  switch (action.type) {
    case `${SET}/${NOTIFICATION_LIST}`:
      return action.notificationList

    case `${ADD}/${WORKSPACE_CONTENT}`: {
      const newNotifications = action.workspaceContentList.map(content => ({
        contentId: content.content_id,
        icon: 'fa-magic',
        text: `${content.author.public_name} created ${content.label} at ${action.workspace.slug}`,
        read: false
      }))
      return [
        ...state,
        ...newNotifications
      ]
    }

    case `${UPDATE}/${WORKSPACE_CONTENT}`: {
      const newNotifications = action.workspaceContentList.map(content => ({
        contentId: content.content_id,
        icon: 'fa-history',
        text: `${content.author.public_name} updated ${content.label} at ${action.workspace.slug}`,
        read: false
      }))
      return [
        ...state,
        ...newNotifications
      ]
    }

    case `${ADD}/${WORKSPACE_MEMBER}`: {
      const newNotifications = action.workspaceContentList.map(content => ({
        contentId: content.content_id,
        icon: 'fa-user-o',
        text: `${content.author.public_name} added you to ${action.workspace.slug}`,
        read: false
      }))
      return [
        ...state,
        ...newNotifications
      ]
    }

    default:
      return state
  }
}
