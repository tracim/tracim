import {
  FLASH_MESSAGE
} from '../action-creator.sync.js'

export default function flashMessage (state = [], action) {
  switch (action.type) {
    case `Add/${FLASH_MESSAGE}`:
      return [...state, {
        message: action.msg.message,
        type: action.msg.type || 'info' // may be info, success, danger
      }]

    case `Remove/${FLASH_MESSAGE}`:
      return state.filter(fm => fm.message === action.message)

    default:
      return state
  }
}
