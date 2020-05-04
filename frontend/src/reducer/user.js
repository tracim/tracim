import {
  SET,
  UPDATE,
  USER_CONNECTED,
  USER_DISCONNECTED,
  USER_LANG,
  USER_USERNAME,
  USER_PUBLIC_NAME,
  USER_EMAIL,
  USER_AGENDA_URL
} from '../action-creator.sync.js'
import { getBrowserLang } from '../helper.js'
import { PROFILE } from 'tracim_frontend_lib'

export const defaultUser = {
  user_id: -1,
  logged: null, // null avoid to be redirected to /login while whoami ep has not responded yet
  auth_type: '',
  timezone: '',
  profile: PROFILE.user,
  email: '',
  is_active: true,
  avatar_url: null,
  created: '',
  public_name: '',
  lang: getBrowserLang(),
  agendaUrl: '',
  username: ''
}

export default function user (state = defaultUser, action) {
  switch (action.type) {
    case `${SET}/${USER_CONNECTED}`:
      return {
        ...state,
        ...action.user,
        lang: action.user.lang ? action.user.lang : state.lang
      }

    case `${SET}/${USER_DISCONNECTED}`:
      return { ...defaultUser, lang: state.lang, logged: false }

    case `${SET}/${USER_LANG}`:
      return { ...state, lang: action.lang }

    case `${UPDATE}/${USER_PUBLIC_NAME}`:
      return { ...state, public_name: action.newName }

    case `${UPDATE}/${USER_USERNAME}`:
      return { ...state, username: action.newUsername }

    case `${UPDATE}/${USER_EMAIL}`:
      return { ...state, email: action.newEmail }

    case `${SET}/${USER_AGENDA_URL}`:
      return { ...state, agendaUrl: action.newAgendaUrl }

    default:
      return state
  }
}
