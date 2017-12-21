import {
  USER_CONNECTED,
  USER_DATA
} from '../action-creator.sync.js'

const serializeUser = data => ({
  id: data.user.id,
  isLoggedIn: data.logged,
  username: data.user.username,
  firstname: data.user.firstname,
  lastname: data.user.lastname,
  email: data.user.email
})

export default function user (state = {
  id: 0,
  isLoggedIn: undefined,
  username: '',
  firstname: '',
  lastname: '',
  email: ''
}, action) {
  switch (action.type) {
    case `Update/${USER_CONNECTED}`:
      return serializeUser(action.user)

    case `Update/${USER_DATA}`:
      return {...state, ...action.data}

    default:
      return state
  }
}
