import { USER_CONNECTED } from '../action-creator.sync.js'

export default function user (state = {
  isLogedIn: false,
  username: '',
  email: ''
}, action) {
  switch (action.type) {
    case `Update/${USER_CONNECTED}`:
      return {...state, isLogedIn: true, ...action.user}

    default:
      return state
  }
}
