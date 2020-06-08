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
      return {
        ...state,
        ...serializeUser(action.user),
        lang: serializeUser(action.user).lang || state.lang
      }

    case `${SET}/${USER_DISCONNECTED}`:
      return { ...state, lang: state.lang, logged: false }

    case `${SET}/${USER_LANG}`:
      return { ...state, lang: action.lang }

    case `${UPDATE}/${USER}`:
      return {
        ...state,
        ...serializeUser(action.newUser),
        agendaUrl: serializeUser(action.newUser).agendaUrl || state.agendaUrl,
        logged: serializeUser(action.newUser).logged || state.logged
      }

    case `${UPDATE}/${USER_USERNAME}`:
      return { ...state, username: action.newUsername }

    case `${SET}/${USER_AGENDA_URL}`:
      return { ...state, agendaUrl: action.newAgendaUrl }

    default:
      return state
  }
}
