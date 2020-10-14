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
import { serialize, sortWorkspaceList } from 'tracim_frontend_lib'
import { serializeSidebarEntryProps, serializeMember } from './currentWorkspace.js'

export const serializeWorkspaceListProps = {
  agenda_enabled: 'agendaEnabled',
  is_deleted: 'isDeleted',
  label: 'label',
  parent_id: 'parentId',
  public_download_enabled: 'downloadEnabled',
  public_upload_enabled: 'uploadEnabled',
  sidebar_entries: 'sidebarEntryList',
  slug: 'slug',
  workspace_id: 'id',
  description: 'description',
  memberList: 'memberList'
}

export function workspaceList (state = [], action, lang) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_LIST}`:
      return action.workspaceList.map(ws => ({
        ...serialize(ws, serializeWorkspaceListProps),
        sidebarEntryList: ws.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps)),
        memberList: []
      }))

    case `${ADD}/${WORKSPACE_LIST}`:
      return sortWorkspaceList([
        ...state,
        ...action.workspaceList
          .filter(w => !state.some(s => s.id === w.workspace_id))
          .map(ws => ({
            ...serialize(ws, serializeWorkspaceListProps),
            sidebarEntryList: ws.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps)),
            memberList: []
          }))
      ], lang)

    case `${REMOVE}/${WORKSPACE_LIST}`:
      return state.filter(ws => ws.id !== action.workspace.workspace_id)

    case `${SET}/${WORKSPACE_LIST_MEMBER}`:
      return state.map(ws => ({
        ...ws,
        memberList: action.workspaceListMemberList.find(wlml => wlml.workspaceId === ws.id).memberList.map(m => (serializeMember(m)))
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
            serializeMember(action.newMember)
          ]
        }
        : ws
      )

    case `${UPDATE}/${WORKSPACE_MEMBER}`:
      if (!state.some(ws => ws.id === action.workspaceId)) return state
      return state.map(ws => ws.id === action.workspaceId
        ? {
          ...ws,
          memberList: ws.memberList.map(m => m.id === action.member.user.user_id
            ? { ...m, ...serializeMember(action.member) }
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
      return sortWorkspaceList(
        state.map(
          ws => ws.id === action.workspaceDetail.workspace_id
            ? {
              ...ws,
              ...serialize(action.workspaceDetail, serializeWorkspaceListProps),
              sidebarEntryList: action.workspaceDetail.sidebar_entries.map(sbe => serialize(sbe, serializeSidebarEntryProps))
            }
            : ws
        ),
        lang
      )

    default:
      return state
  }
}

export default workspaceList
