import {
  SET,
  UPDATE,
  USER,
  USER_CONNECTED,
  USER_DISCONNECTED,
  USER_LANG,
  USER_USERNAME,
  USER_AGENDA_URL
} from '../action-creator.sync.js'
import { getBrowserLang } from '../util/helper.js'
import { PROFILE } from 'tracim_frontend_lib'

export const serializeUser = u => ({
  userId: u.user_id,
  logged: u.logged,
  authType: u.auth_type,
  timezone: u.timezone,
  profile: u.profile,
  email: u.email,
  isActive: u.is_active,
  avatarUrl: u.avatar_url,
  created: u.created,
  publicName: u.public_name,
  lang: u.lang,
  agendaUrl: u.agendaUrl,
  username: u.username
})

export const unserializeUser = u => ({
  user_id: u.userId,
  logged: u.logged,
  auth_type: u.authType,
  timezone: u.timezone,
  profile: u.profile,
  email: u.email,
  is_active: u.isActive,
  avatar_url: u.avatarUrl,
  created: u.created,
  public_name: u.publicName,
  lang: u.lang,
  agendaUrl: u.agendaUrl,
  username: u.username
})

export const defaultUser = {
  userId: -1,
  logged: null, // null avoid to be redirected to /login while whoami ep has not responded yet
  authType: '',
  timezone: '',
  profile: PROFILE.user,
  email: '',
  isActive: true,
  avatarUrl: null,
  created: '',
  publicName: '',
  lang: getBrowserLang(),
  agendaUrl: '',
  username: ''
}

export default function user (state = defaultUser, action) {
  switch (action.type) {
    case `${SET}/${USER_CONNECTED}`:
      // INFO - 2020-06-10 - GB - We need to do this because when action.user goes through the serializeUser
      // the properties that it doesn't have are set as undefined and overwrite all the properties of state
      return serializeUser({ ...unserializeUser(state), ...action.user })

    case `${SET}/${USER_DISCONNECTED}`:
      return { ...state, lang: state.lang, logged: false }

    case `${SET}/${USER_LANG}`:
      return { ...state, lang: action.lang }

    case `${UPDATE}/${USER}`:
      return serializeUser({ ...unserializeUser(state), ...action.newUser })

    case `${UPDATE}/${USER_USERNAME}`:
      return { ...state, username: action.newUsername }

    case `${SET}/${USER_AGENDA_URL}`:
      return { ...state, agendaUrl: action.newAgendaUrl }

    default:
      return state
  }
}
