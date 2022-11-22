import {
  ACCESSIBLE_WORKSPACE_LIST,
  ACCESSIBLE_WORKSPACE,
  ADD,
  REMOVE,
  UPDATE,
  SET
} from '../action-creator.sync.js'
import { serializeWorkspaceListProps } from './workspaceList.js'
import { serialize, SORT_BY, sortListByMultipleCriteria } from 'tracim_frontend_lib'

const accessibleWorkspaceList = (state = [], action) => {
  switch (action.type) {
    case `${SET}/${ACCESSIBLE_WORKSPACE_LIST}`:
      return sortListByMultipleCriteria(
        action.workspaceList.map(ws => serialize(ws, serializeWorkspaceListProps)),
        [SORT_BY.LABEL, SORT_BY.ID]
      )
    case `${ADD}/${ACCESSIBLE_WORKSPACE}`:
      return sortListByMultipleCriteria(
        [
          ...state,
          serialize(action.workspace, serializeWorkspaceListProps)
        ],
        [SORT_BY.LABEL, SORT_BY.ID]
      )
    case `${UPDATE}/${ACCESSIBLE_WORKSPACE}`:
      return sortListByMultipleCriteria(
        [
          ...state.filter(workspace => workspace.id !== action.workspace.workspace_id),
          serialize(action.workspace, serializeWorkspaceListProps)
        ],
        [SORT_BY.LABEL, SORT_BY.ID]
      )
    case `${REMOVE}/${ACCESSIBLE_WORKSPACE}`:
      return state.filter(workspace => workspace.id !== action.workspace.workspace_id)
    default:
      return state
  }
}

export default accessibleWorkspaceList
