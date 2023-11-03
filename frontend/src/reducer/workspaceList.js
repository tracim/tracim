import {
  ADD,
  REMOVE,
  SET,
  UPDATE,
  USER_WORKSPACE_EMAIL_NOTIFICATION_TYPE,
  WORKSPACE_LIST,
  WORKSPACE_SETTING_LIST,
  WORKSPACE_DETAIL
} from '../action-creator.sync.js'
import { serialize, sortListByMultipleCriteria, SORT_BY, SORT_ORDER } from 'tracim_frontend_lib'
import { EMAIL_NOTIFICATION_TYPE } from '../util/helper.js'
import { serializeRole, serializeSidebarEntryProps } from './currentWorkspace.js'

export const serializeWorkspaceListProps = {
  access_type: 'accessType',
  agenda_enabled: 'agendaEnabled',
  default_user_role: 'defaultRole',
  description: 'description',
  public_download_enabled: 'downloadEnabled',
  workspace_id: 'id',
  is_deleted: 'isDeleted',
  label: 'label',
  parent_id: 'parentId',
  publication_enabled: 'publicationEnabled',
  sidebar_entries: 'sidebarEntryList',
  slug: 'slug',
  public_upload_enabled: 'uploadEnabled',
  members: 'memberList'
}

export const serializeWorkspace = workspace => {
  return {
    ...serialize(workspace, serializeWorkspaceListProps),
    sidebarEntryList: workspace.sidebar_entries.map(
      sbe => serialize(sbe, serializeSidebarEntryProps)
    ),
    memberList: (workspace.members || []).map(serializeRole)
  }
}

export const serializeUserSetting = m => {
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

export const serializeUserWorkspaceSetting = setting => {
  // TODO - CH - 2023-11-02 - This function should use serializeWorkspace
  // and be renamed according to this issue: https://github.com/tracim/tracim/issues/6252
  return {
    ...serialize(setting.workspace, serializeWorkspaceListProps),
    sidebarEntryList: setting.workspace.sidebar_entries.map(
      sbe => serialize(sbe, serializeSidebarEntryProps)
    ),
    memberList: [setting].map(serializeUserSetting)
  }
}

export function workspaceList (state = [], action, lang) {
  switch (action.type) {
    case `${SET}/${WORKSPACE_SETTING_LIST}`:
      return action.workspaceSettingList.map(serializeUserWorkspaceSetting)

    case `${UPDATE}/${WORKSPACE_SETTING_LIST}`:
      return state.map(setting => {
        if (setting.id !== action.workspaceId) return setting
        return {
          ...setting,
          memberList: setting.memberList.map(m => m.id === action.setting.user.user_id
            ? { ...m, ...serializeUserSetting(action.setting) }
            : m
          )
        }
      })

    case `${SET}/${WORKSPACE_LIST}`:
      return action.workspaceList.map(serializeWorkspace)

    case `${ADD}/${WORKSPACE_LIST}`: {
      const spaceList = [
        ...state,
        ...action.workspaceList
          .filter(w => !state.some(s => s.id === w.workspace_id))
          .map(serializeWorkspace)
      ]
      return sortListByMultipleCriteria(spaceList, [SORT_BY.LABEL, SORT_BY.ID], SORT_ORDER.ASCENDING, lang)
    }

    case `${REMOVE}/${WORKSPACE_LIST}`:
      return state.filter(ws => ws.id !== action.workspace.workspace_id)

    case `${UPDATE}/${WORKSPACE_DETAIL}`: {
      if (!state.some(ws => ws.id === action.workspaceDetail.workspace_id)) return state
      const spaceList = state.map(
        ws => ws.id === action.workspaceDetail.workspace_id
          ? serializeWorkspace(action.workspaceDetail) // Error here ; members is undefined
          : ws
      )
      return sortListByMultipleCriteria(spaceList, [SORT_BY.LABEL, SORT_BY.ID], SORT_ORDER.ASCENDING, lang)
    }

    case `${UPDATE}/${USER_WORKSPACE_EMAIL_NOTIFICATION_TYPE}`: {
      return action.workspaceId === state.id
        ? {
          ...state,
          memberList: state.memberList.map(u => u.id === action.userId
            ? { ...u, emailNotificationType: action.emailNotificationType }
            : u
          )
        }
        : state
    }

    default:
      return state
  }
}

export default workspaceList
