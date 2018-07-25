import { TIMEZONE } from '../action-creator.sync.js'

export function timezone (state = [], action) {
  switch (action.type) {
    case `Set/${TIMEZONE}`:
      return action.timezone

    default:
      return state
  }
}

export default timezone
