import { uniqBy } from 'lodash'
import {
  SET,
  ADD,
  REMOVE,
  WORKSPACE_DETAIL,
  WORKSPACE_MEMBER_LIST,
  WORKSPACE_READ_STATUS,
  WORKSPACE_READ_STATUS_LIST,
  WORKSPACE_MEMBER,
  UPDATE,
  USER,
  USER_WORKSPACE_EMAIL_NOTIFICATION_TYPE,
  FOLDER_READ,
  WORKSPACE_AGENDA_URL,
  WORKSPACE_CONTENT,
  RESTORE,
  WORKSPACE_LOADED
} from '../action-creator.sync.js'
import { serializeContentProps } from './workspaceContentList.js'
import { EMAIL_NOTIFICATION_TYPE } from '../util/helper.js'
import { serialize } from 'tracim_frontend_lib'

const defaultWorkspace = {
  accessType: '',
  defaultRole: '',
  id: 0,
  slug: '',
  label: '',
  description: '',
  agendaEnabled: false,
  downloadEnabled: false,
  uploadEnabled: false,
  sidebarEntryList: [],
  memberList: [],
  recentActivityList: [],
  contentReadStatusList: [],
  agendaUrl: '',
  workspaceLoaded: false
}

export const serializeWorkspace = ws => {
  return {
    accessType: ws.access_type,
    agendaEnabled: ws.agenda_enabled,
    defaultRole: ws.default_user_role,
    description: ws.description,
    downloadEnabled: ws.public_download_enabled,
    id: ws.workspace_id,
    label: ws.label,
    memberList: ws.members,
    publicationEnabled: ws.publication_enabled,
    slug: ws.slug,
    uploadEnabled: ws.public_upload_enabled
  }
}

export const serializeSidebarEntryProps = {
  slug: 'slug',
  route: 'route',
  fa_icon: 'faIcon',
  hexcolor: 'hexcolor',
  label: 'label'
}

export const serializeMember = m => {
  return {
    id: m.user.user_id,
    publicName: m.user.public_name,
    username: m.user.username,
    role: m.role,
    emailNotificationType: m.email_notification_type || EMAIL_NOTIFICATION_TYPE.NONE,
    hasAvatar: m.user.has_avatar || true,
    hasCover: m.user.has_cover || false
  }
}

export default function currentWorkspace (state = defaultWorkspace, action) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_DETAIL}`:
      return {
        ...state,
        ...serializeWorkspace(action.workspaceDetail),
        sidebarEntryList: action.workspaceDetail.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps))
      }

    // INFO - CH - 2020-06-18 - only difference with SET/WORKSPACE_DETAIL is the if (state.id !== action.workspace.workspace_id)
    // because this action is called by the TLM handler.
    // The SET is used to force a new workspace
    // The UPDATE is to update the same workspace
    case `${UPDATE}/${WORKSPACE_DETAIL}`:
      if (state.id !== action.workspaceDetail.workspace_id) return state
      return {
        ...state,
        ...serializeWorkspace(action.workspaceDetail),
        sidebarEntryList: action.workspaceDetail.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps))
      }

    case `${SET}/${WORKSPACE_MEMBER_LIST}`:
      return {
        ...state,
        memberList: action.workspaceMemberList.map(m => serializeMember(m))
      }

    case `${ADD}/${WORKSPACE_MEMBER}`:
      if (state.id !== action.workspaceId) return state
      return {
        ...state,
        memberList: uniqBy([
          ...state.memberList,
          serializeMember(action.newMember)
        ], 'id')
      }

    case `${UPDATE}/${WORKSPACE_MEMBER}`:
      if (state.id !== action.workspaceId) return state
      return {
        ...state,
        memberList: state.memberList.map(m => m.id === action.member.user.user_id
          ? { ...m, ...serializeMember(action.member) }
          : m
        )
      }

    case `${REMOVE}/${WORKSPACE_MEMBER}`:
      if (state.id !== action.workspaceId) return state
      return {
        ...state,
        memberList: state.memberList.filter(m => m.id !== action.memberId)
      }

    case `${ADD}/${WORKSPACE_CONTENT}`:
    case `${RESTORE}/${WORKSPACE_CONTENT}`:
      if (state.id !== action.workspaceId) return state
      return {
        ...state,
        recentActivityList: [
          ...action.workspaceContentList.map(c => serialize(c, serializeContentProps)),
          ...state.recentActivityList
        ]
      }

    case `${UPDATE}/${WORKSPACE_CONTENT}`:
      if (state.id !== action.workspaceId) {
        return {
          ...state,
          recentActivityList: state.recentActivityList.filter(c => !action.workspaceContentList.some(cc => c.id === cc.content_id)),
          contentReadStatusList: state.contentReadStatusList.filter(contentId => !action.workspaceContentList.some(content => content.content_id === contentId))
        }
      }
      return {
        ...state,
        recentActivityList: uniqBy(
          [ // INFO - CH - 2020-05-18 - always put the updated element at the beginning. Then remove duplicates
            ...action.workspaceContentList.map(c => serialize(c, serializeContentProps)),
            ...state.recentActivityList
          ],
          'id'
        ),
        contentReadStatusList: state.contentReadStatusList.filter(contentId =>
          !action.workspaceContentList.some(content => content.content_id === contentId)
        )
      }

    case `${REMOVE}/${WORKSPACE_CONTENT}`:
      if (state.id !== action.workspaceId) return state
      return {
        ...state,
        recentActivityList: state.recentActivityList.filter(c => !action.workspaceContentList.some(cc => c.id === cc.content_id))
      }

    case `${SET}/${WORKSPACE_READ_STATUS_LIST}`:
      return {
        ...state,
        contentReadStatusList: action.workspaceReadStatusList
          .filter(content => content.read_by_user)
          .map(content => content.content_id)
      }

    case `${ADD}/${WORKSPACE_READ_STATUS_LIST}`:
      if (state.id !== action.workspaceId) return state
      return {
        ...state,
        contentReadStatusList: [
          ...state.contentReadStatusList,
          action.content.content_id
        ]
      }

    case `${REMOVE}/${WORKSPACE_READ_STATUS}`: // INFO - CH - 20200529 - this means "set content as unread"
      if (state.id !== action.workspaceId) return state
      return {
        ...state,
        contentReadStatusList: state.contentReadStatusList.filter(id => id !== action.unreadContent.content_id),
        recentActivityList: [
          serialize(action.unreadContent, serializeContentProps),
          ...state.recentActivityList.filter(content => content.id !== action.unreadContent.content_id)
        ]
      }

    case `${UPDATE}/${USER_WORKSPACE_EMAIL_NOTIFICATION_TYPE}`:
      return action.workspaceId === state.id
        ? {
          ...state,
          memberList: state.memberList.map(u => u.id === action.userId
            ? { ...u, emailNotificationType: action.emailNotificationType }
            : u
          )
        }
        : state

    case `${SET}/${FOLDER_READ}`:
      return state.contentReadStatusList.includes(action.folderId)
        ? state
        : {
          ...state,
          contentReadStatusList: [...state.contentReadStatusList, action.folderId]
        }

    case `${SET}/${WORKSPACE_AGENDA_URL}`:
      return { ...state, agendaUrl: action.agendaUrl }

    case `${SET}/${WORKSPACE_LOADED}`:
      return { ...state, workspaceLoaded: true }

    case `${UPDATE}/${USER}`:
      if (!state.memberList.some(member => member.id === action.newUser.user_id)) return state

      return {
        ...state,
        memberList: state.memberList.map(member => member.id === action.newUser.user_id
          ? serializeMember({ ...member, user: action.newUser })
          : member
        )
      }

    default:
      return state
  }
}
