import { LIVE_MESSAGE_STATUS } from '../util/LiveMessageManager.js'
import { SET, TLM_MANAGER, TLM_MANAGER_STATUS } from '../action-creator.sync.js'

const defaultTlmState = {
  manager: null,
  status: LIVE_MESSAGE_STATUS.CLOSED
}

export default function tlm (state = defaultTlmState, action) {
  switch (action.type) {
    case `${SET}/${TLM_MANAGER}`:
      return { ...state, manager: action.TLMManager }
    case `${SET}/${TLM_MANAGER_STATUS}`:
      return { ...state, status: action.status }
    default:
      return state
  }
}
