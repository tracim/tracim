import {
  ADD,
  REMOVE,
  SET,
  UPDATE,
  USER_WORKSPACE_DO_NOTIFY,
  WORKSPACE_LIST,
  WORKSPACE_LIST_MEMBER,
  WORKSPACE_MEMBER,
  WORKSPACE_DETAIL
} from '../action-creator.sync.js'
import { serialize } from 'tracim_frontend_lib'
import { serializeSidebarEntryProps } from './currentWorkspace.js'
import { sortWorkspaceList } from '../util/helper'

export const serializeWorkspaceListProps = {
  agenda_enabled: 'agendaEnabled',
  isOpenInSidebar: 'isOpenInSidebar',
  is_deleted: 'isDeleted',
  label: 'label',
  public_download_enabled: 'downloadEnabled',
  public_upload_enabled: 'uploadEnabled',
  sidebar_entries: 'sidebarEntryList',
  slug: 'slug',
  workspace_id: 'id',
  description: 'description',
  memberList: 'memberList'
}

export function workspaceList (state = [], action) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_LIST}`:
      return action.workspaceList.map(ws => ({
        ...serialize(ws, serializeWorkspaceListProps),
        sidebarEntryList: ws.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps)),
        memberList: []
      }))

    case `${ADD}/${WORKSPACE_LIST}`:
      return [
        ...state,
        ...action.workspaceList.map(ws => ({
          ...serialize(ws, serializeWorkspaceListProps),
          sidebarEntryList: ws.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps)),
          memberList: []
        }))
      ].sort(sortWorkspaceList)

    case `${REMOVE}/${WORKSPACE_LIST}`:
      return state.filter(ws => ws.id !== action.workspace.workspace_id)

    case `${SET}/${WORKSPACE_LIST}/isOpenInSidebar`:
      return state.map(ws => ({ ...ws, isOpenInSidebar: ws.id === action.workspaceId ? action.isOpenInSidebar : ws.isOpenInSidebar }))

    case `${SET}/${WORKSPACE_LIST_MEMBER}`:
      return state.map(ws => ({
        ...ws,
        memberList: action.workspaceListMemberList.find(wlml => wlml.workspaceId === ws.id).memberList.map(m => ({
          id: m.user_id,
          publicName: m.user.public_name,
          role: m.role,
          isActive: m.is_active,
          doNotify: m.do_notify
        }))
      }))

    case `${UPDATE}/${USER_WORKSPACE_DO_NOTIFY}`:
      return state.map(ws => ws.id === action.workspaceId
        ? {
          ...ws,
          memberList: ws.memberList.map(u => u.id === action.userId
            ? { ...u, doNotify: action.doNotify }
            : u
          )
        }
        : ws
      )

    case `${ADD}/${WORKSPACE_MEMBER}`:
      if (!state.some(ws => ws.id === action.workspaceId)) return state
      return state.map(ws => ws.id === action.workspaceId
        ? {
          ...ws,
          memberList: [
            ...ws.memberList,
            {
              id: action.newMember.user_id,
              publicName: action.newMember.public_name,
              role: action.role,
              isActive: action.newMember.is_active,
              doNotify: action.newMember.do_notify
            }
          ]
        }
        : ws
      )

    case `${UPDATE}/${WORKSPACE_MEMBER}`:
      if (!state.some(ws => ws.id === action.workspaceId)) return state
      return state.map(ws => ws.id === action.workspaceId
        ? {
          ...ws,
          memberList: ws.memberList.map(m => m.id === action.member.user_id
            ? { ...m, id: action.member.user_id, ...action.member, role: action.role }
            : m
          )
        }
        : ws
      )

    case `${REMOVE}/${WORKSPACE_MEMBER}`:
      if (!state.some(ws => ws.id === action.workspaceId)) return state
      return state.map(ws => ws.id === action.workspaceId
        ? {
          ...ws,
          memberList: ws.memberList.filter(m => m.id !== action.memberId)
        }
        : ws
      )

    case `${UPDATE}/${WORKSPACE_DETAIL}`:
      if (!state.some(ws => ws.id === action.workspaceDetail.workspace_id)) return state
      return state.map(ws => ws.id === action.workspaceDetail.workspace_id
        ? {
          ...ws,
          ...serialize(action.workspaceDetail, serializeWorkspaceListProps),
          sidebarEntryList: action.workspaceDetail.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps))
        }
        : ws
      )

    default:
      return state
  }
}

export default workspaceList
