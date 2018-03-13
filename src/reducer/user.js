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
  email: data.user.email,
  avatar: data.user.avatar,
  role: data.user.role,
  job: data.user.job,
  company: data.user.company,
  caldavUrl: data.user.caldav_url
})

export default function user (state = {
  id: -1,
  isLoggedIn: undefined,
  username: '',
  firstname: '',
  lastname: '',
  email: '',
  avatar: ''
}, action) {
  switch (action.type) {
    case `Set/${USER_CONNECTED}`:
      return serializeUser(action.user)

    case `Update/${USER_DATA}`:
      return {...state, ...action.data}

    default:
      return state
  }
}
