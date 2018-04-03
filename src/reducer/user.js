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

const defaultUser = {
  id: -1,
  isLoggedIn: undefined, // undefined means the api (/is_logged_in) has not responded yet
  username: '',
  firstname: '',
  lastname: '',
  email: '',
  avatar: ''
}

export default function user (state = defaultUser, action) {
  switch (action.type) {
    case `Set/${USER_CONNECTED}`:
      return action.data.logged
        ? serializeUser(action.data)
        : {...defaultUser, isLoggedIn: false}

    case `Update/${USER_DATA}`:
      return {...state, ...action.data}

    default:
      return state
  }
}
