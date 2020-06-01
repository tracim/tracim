import { SET, TLM_MANAGER } from '../action-creator.sync.js'

export default function tlmManager (state = null, action) {
  switch(action.type) {
    case `${SET}/${TLM_MANAGER}`:
      return action.TLMManager
    default:
      return state
  }
}
