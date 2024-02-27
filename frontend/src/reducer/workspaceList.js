import {
  ADD_USER_WORKSPACE_CONFIG_LIST,
  UPDATE_USER_WORKSPACE_CONFIG_LIST,
  UPDATE_USER_WORKSPACE_EMAIL_NOTIFICATION_TYPE,
  REMOVE,
  UPDATE,
  WORKSPACE_LIST,
  SET_USER_WORKSPACE_CONFIG_LIST,
  WORKSPACE_DETAIL
} from '../action-creator.sync.js'
import { serialize, sortListByMultipleCriteria, SORT_BY, SORT_ORDER } from 'tracim_frontend_lib'
import { serializeSidebarEntryProps, serializeWorkspace } from './currentWorkspace.js'
import { EMAIL_NOTIFICATION_TYPE } from '../util/helper.js'

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

export const serializeUserConfig = userConfig => {
  return {
    id: userConfig.user.user_id,
    publicName: userConfig.user.public_name,
    username: userConfig.user.username,
    role: userConfig.role,
    emailNotificationType: userConfig.email_notification_type || EMAIL_NOTIFICATION_TYPE.NONE,
    hasAvatar: userConfig.user.has_avatar || true,
    hasCover: userConfig.user.has_cover || false
  }
}

export const serializeUserWorkspaceConfig = userWorkspaceConfig => {
  return {
    ...serialize(userWorkspaceConfig.workspace, serializeWorkspaceListProps),
    sidebarEntryList: userWorkspaceConfig.workspace.sidebar_entries.map(
      sbe => serialize(sbe, serializeSidebarEntryProps)
    ),
    memberList: [userWorkspaceConfig].map(serializeUserConfig)
  }
}
function addWorkspaceSetting (setting, user, workspace, workspaceList) {
  const settings = {
    ...setting,
    workspace: workspace,
    workspace_id: workspace.workspace_id,
    user: user,
    user_id: user.user_id
  }
  const spaceList = [
    ...workspaceList,
    serializeUserWorkspaceConfig(settings)
  ]
  return spaceList
}

export function workspaceList (state = [], action, lang) {
  switch (action.type) {
    case SET_USER_WORKSPACE_CONFIG_LIST:
      return action.workspaceList.map(serializeUserWorkspaceConfig)

    case ADD_USER_WORKSPACE_CONFIG_LIST :
      return sortListByMultipleCriteria(
        addWorkspaceSetting(action.setting, action.user, action.workspace, state),
        [SORT_BY.LABEL, SORT_BY.ID],
        SORT_ORDER.ASCENDING,
        lang
      )

    case UPDATE_USER_WORKSPACE_CONFIG_LIST :
      return sortListByMultipleCriteria(
        addWorkspaceSetting(
          action.setting,
          action.user,
          action.workspace,
          state.filter(ws => ws.id !== action.workspace.workspace_id)
        ),
        [SORT_BY.LABEL, SORT_BY.ID],
        SORT_ORDER.ASCENDING,
        lang
      )

    case `${REMOVE}/${WORKSPACE_LIST}`:
      return state.filter(ws => ws.id !== action.workspace.workspace_id)

    case `${UPDATE}/${WORKSPACE_DETAIL}`: {
      if (!state.some(ws => ws.id === action.workspaceDetail.workspace_id)) return state
      const spaceList = state.map(
        ws => ws.id === action.workspaceDetail.workspace_id
          ? { ...ws, ...serializeWorkspace(action.workspaceDetail) }
          : ws
      )
      return sortListByMultipleCriteria(spaceList, [SORT_BY.LABEL, SORT_BY.ID], SORT_ORDER.ASCENDING, lang)
    }

    case UPDATE_USER_WORKSPACE_EMAIL_NOTIFICATION_TYPE:
      if (!state.some(ws => ws.id === action.workspaceId)) return state
      return state.map(
        ws => ws.id === action.workspaceId
          ? { ...ws, memberList: [{ ...ws.memberList[0], emailNotificationType: action.emailNotificationType }] }
          : ws
      )

    default:
      return state
  }
}

export default workspaceList
