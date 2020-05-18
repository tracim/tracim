import { uniqBy } from 'lodash'
import {
  SET,
  ADD,
  APPEND,
  REMOVE,
  WORKSPACE_DETAIL,
  WORKSPACE_MEMBER_LIST,
  WORKSPACE_READ_STATUS_LIST,
  WORKSPACE_RECENT_ACTIVITY_LIST,
  WORKSPACE_MEMBER, UPDATE,
  USER_WORKSPACE_DO_NOTIFY,
  FOLDER_READ,
  WORKSPACE_AGENDA_URL, WORKSPACE_CONTENT
} from '../action-creator.sync.js'
import { serializeContent } from './workspaceContentList.js'

const defaultWorkspace = {
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
  agendaUrl: ''
}

export const serializeWorkspace = ws => {
  return {
    id: ws.workspace_id,
    slug: ws.slug,
    label: ws.label,
    description: ws.description,
    agendaEnabled: ws.agenda_enabled,
    downloadEnabled: ws.public_download_enabled,
    uploadEnabled: ws.public_upload_enabled
  }
}

export const serializeSidebarEntry = sbe => {
  return {
    slug: sbe.slug,
    route: sbe.route,
    faIcon: sbe.fa_icon,
    hexcolor: sbe.hexcolor,
    label: sbe.label
  }
}

export const serializeMember = m => {
  return {
    id: m.user.user_id,
    publicName: m.user.public_name,
    role: m.role,
    isActive: m.is_active || true,
    doNotify: m.do_notify
  }
}

export default function currentWorkspace (state = defaultWorkspace, action) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_DETAIL}`:
      return {
        ...state,
        ...serializeWorkspace(action.workspaceDetail),
        sidebarEntryList: action.workspaceDetail.sidebar_entries.map(sbe => serializeSidebarEntry(sbe))
      }

    case `${SET}/${WORKSPACE_MEMBER_LIST}`:
      return {
        ...state,
        memberList: action.workspaceMemberList.map(m => serializeMember(m))
      }

    case `${ADD}/${WORKSPACE_MEMBER}`:
      return {
        ...state,
        memberList: [
          ...state.memberList,
          { ...serializeMember(action.newMember) }
        ]
      }

    case `${UPDATE}/${WORKSPACE_MEMBER}`:
      return {
        ...state,
        memberList: state.memberList.map(m => m.id === action.member.user.user_id
          ? { ...m, ...serializeMember(action.member) }
          : m
        )
      }

    case `${REMOVE}/${WORKSPACE_MEMBER}`:
      return {
        ...state,
        memberList: state.memberList.filter(m => m.id !== action.memberId)
      }

    case `${SET}/${WORKSPACE_RECENT_ACTIVITY_LIST}`:
      return {
        ...state,
        recentActivityList: action.workspaceRecentActivityList.map(ra => serializeContent(ra))
      }

    case `${APPEND}/${WORKSPACE_RECENT_ACTIVITY_LIST}`:
      return {
        ...state,
        recentActivityList: [
          ...state.recentActivityList,
          ...action.workspaceRecentActivityList.map(ra => serializeContent(ra))
        ]
      }

    case `${ADD}/${WORKSPACE_CONTENT}`:
      return {
        ...state,
        recentActivityList: [
          ...action.workspaceContentList.map(c => serializeContent(c)),
          ...state.recentActivityList
        ]
      }

    case `${UPDATE}/${WORKSPACE_CONTENT}`:
      return {
        ...state,
        recentActivityList: uniqBy(
          [ // INFO - CH - 2020-05-18 - always put the updated element at the beginning. Then remove duplicates
            ...action.workspaceContentList.map(c => serializeContent(c)),
            ...state.recentActivityList
          ],
          'id'
        )
      }

    case `${REMOVE}/${WORKSPACE_CONTENT}`:
      return {
        ...state,
        recentActivityList: state.recentActivityList.filter(c => !action.workspaceContentList.includes(c))
      }

    case `${SET}/${WORKSPACE_READ_STATUS_LIST}`:
      return {
        ...state,
        contentReadStatusList: action.workspaceReadStatusList
          .filter(content => content.read_by_user)
          .map(content => content.content_id)
      }

    case `${UPDATE}/${USER_WORKSPACE_DO_NOTIFY}`:
      return action.workspaceId === state.id
        ? {
          ...state,
          memberList: state.memberList.map(u => u.id === action.userId
            ? { ...u, doNotify: action.doNotify }
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

    default:
      return state
  }
}
