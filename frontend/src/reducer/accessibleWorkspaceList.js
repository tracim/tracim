import {
  ACCESSIBLE_WORKSPACE_LIST,
  ACCESSIBLE_WORKSPACE,
  ADD,
  REMOVE,
  SET
} from '../action-creator.sync.js'
import { serializeWorkspaceListProps } from './workspaceList.js'
import { serialize, sortWorkspaceList } from 'tracim_frontend_lib'

const accessibleWorkspaceList = (state = [], action) => {
  switch (action.type) {
    case `${SET}/${ACCESSIBLE_WORKSPACE_LIST}`:
      return sortWorkspaceList(action.workspaceList.map(ws => serialize(ws, serializeWorkspaceListProps)))
    case `${ADD}/${ACCESSIBLE_WORKSPACE}`:
      return sortWorkspaceList(
        [
          ...state,
          serialize(action.workspace, serializeWorkspaceListProps)
        ]
      )
    case `${REMOVE}/${ACCESSIBLE_WORKSPACE}`:
      return state.filter(workspace => workspace.id !== action.workspace.workspace_id)
    default:
      return state
  }
}

export default accessibleWorkspaceList
