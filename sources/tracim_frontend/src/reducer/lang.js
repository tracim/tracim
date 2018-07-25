import { LANG } from '../action-creator.sync.js'

export function lang (state = [], action) {
  switch (action.type) {
    case `Update/${LANG}`:
      return action.langList

    case `Set/${LANG}/Active`:
      return state.map(l => ({...l, active: l.id === action.langId}))

    default:
      return state
  }
}

export default lang
