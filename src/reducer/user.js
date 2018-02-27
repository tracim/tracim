import {
  USER_CONNECTED,
  USER_DATA
} from '../action-creator.sync.js'

export default function user (state = {
  isLoggedIn: false,
  username: '',
  email: ''
}, action) {
  switch (action.type) {
    case `Update/${USER_CONNECTED}`:
      return {...state, isLoggedIn: true, ...action.user}

    case `Update/${USER_DATA}`:
      return {...state, ...action.data}

    default:
      return state
  }
}
