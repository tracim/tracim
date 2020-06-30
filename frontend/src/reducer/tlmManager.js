import { SET, TLM_MANAGER, TLM_MANAGER_STATUS } from '../action-creator.sync.js'

export default function tlm (state = {}, action) {
  switch (action.type) {
    case `${SET}/${TLM_MANAGER}`:
      return { ...state, manager: action.TLMManager }
    case `${SET}/${TLM_MANAGER_STATUS}`:
      return { ...state, status: action.status }
    default:
      return state
  }
}
