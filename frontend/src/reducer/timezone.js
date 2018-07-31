import { SET, TIMEZONE } from '../action-creator.sync.js'

export function timezone (state = [], action) {
  switch (action.type) {
    case `${SET}/${TIMEZONE}`:
      return action.timezone

    default:
      return state
  }
}

export default timezone
