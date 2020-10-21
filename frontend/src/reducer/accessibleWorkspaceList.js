import {
  ACCESSIBLE_WORKSPACE_LIST,
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
    case `${ADD}/${ACCESSIBLE_WORKSPACE_LIST}`:
      return sortWorkspaceList(
        [
          ...state,
          action.workspace
        ]
      )
    case `${REMOVE}/${ACCESSIBLE_WORKSPACE_LIST}`:
      return state.filter(workspace => workspace.id !== action.workspace.id)
    default:
      return state
  }
}

export default accessibleWorkspaceList
