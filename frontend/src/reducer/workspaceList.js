import {
  ADD_ROLE_WORKSPACE_LIST,
  UPDATE_ROLE_WORKSPACE_LIST,
  REMOVE,
  SET,
  UPDATE,
  WORKSPACE_LIST,
  ROLE_WORKSPACE_LIST,
  WORKSPACE_DETAIL
} from '../action-creator.sync.js'
import { serialize, sortListByMultipleCriteria, SORT_BY, SORT_ORDER } from 'tracim_frontend_lib'
import { serializeMember, serializeSidebarEntryProps } from './currentWorkspace.js'

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
    memberList: (workspace.members || []).map(serializeMember)
  }
}

export const serializeRole = role => {
  // TODO - CH - 2023-11-02 - This function should use serializeWorkspace
  // and be renamed according to this issue: https://github.com/tracim/tracim/issues/6252
  return {
    ...serialize(role.workspace, serializeWorkspaceListProps),
    sidebarEntryList: role.workspace.sidebar_entries.map(
      sbe => serialize(sbe, serializeSidebarEntryProps)
    ),
    memberList: [role].map(serializeMember)
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
    serializeRole(settings)
  ]
  return spaceList
}

export function workspaceList (state = [], action, lang) {
  switch (action.type) {
    case `${SET}/${ROLE_WORKSPACE_LIST}`:
      return action.workspaceList.map(serializeRole)

    case `${SET}/${WORKSPACE_LIST}`:
      return action.workspaceList.map(serializeWorkspace)

    case ADD_ROLE_WORKSPACE_LIST :
      return sortListByMultipleCriteria(
        addWorkspaceSetting(action.setting, action.user, action.workspace, state),
        [SORT_BY.LABEL, SORT_BY.ID],
        SORT_ORDER.ASCENDING, lang
      )

    case UPDATE_ROLE_WORKSPACE_LIST :
      return sortListByMultipleCriteria(
        addWorkspaceSetting(
          action.setting,
          action.user,
          action.workspace,
          state.filter(ws => ws.id !== action.workspace.workspace_id)
        ),
        [SORT_BY.LABEL, SORT_BY.ID], SORT_ORDER.ASCENDING, lang)

    case `${REMOVE}/${WORKSPACE_LIST}`:
      return state.filter(ws => ws.id !== action.workspace.workspace_id)

    case `${UPDATE}/${WORKSPACE_DETAIL}`: {
      if (!state.some(ws => ws.id === action.workspaceDetail.workspace_id)) return state
      const spaceList = state.map(
        ws => ws.id === action.workspaceDetail.workspace_id
          ? serializeWorkspace(action.workspaceDetail)
          : ws
      )
      return sortListByMultipleCriteria(spaceList, [SORT_BY.LABEL, SORT_BY.ID], SORT_ORDER.ASCENDING, lang)
    }

    default:
      return state
  }
}

export default workspaceList
