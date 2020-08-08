import { ADD, REMOVE, FLASH_MESSAGE } from '../action-creator.sync.js'

export default function flashMessage (state = [], action) {
  switch (action.type) {
    case `${ADD}/${FLASH_MESSAGE}`:
      return [...state, {
        message: action.msg.message,
        type: action.msg.type || 'info' // may be info, warning, danger
      }]

    case `${REMOVE}/${FLASH_MESSAGE}`:
      return state.filter(fm => fm.message === action.message)

    default:
      return state
  }
}
