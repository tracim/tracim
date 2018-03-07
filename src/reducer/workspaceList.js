import {
  WORKSPACE_LIST
} from '../action-creator.sync.js'

export function workspaceList (state = [], action) {
  switch (action.type) {
    case `Update/${WORKSPACE_LIST}`:
      return action.workspaceList.map(ws => ({
        ...ws,
        isOpen: false
      }))

    case `Set/${WORKSPACE_LIST}/isOpen`:
      return state.map(ws => ws.id === action.workspaceId
        ? {...ws, isOpen: action.isOpen}
        : ws
      )

    default:
      return state
  }
}

export default workspaceList
