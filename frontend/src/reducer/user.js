import {
  SET,
  UPDATE,
  USER_CONNECTED,
  USER_DISCONNECTED,
  USER_LANG,
  USER_NAME,
  USER_EMAIL
} from '../action-creator.sync.js'
import { generateAvatarFromPublicName } from 'tracim_frontend_lib'
import { getBrowserLang } from '../helper.js'

const defaultUser = {
  user_id: -1,
  logged: null, // null avoid to be redirected to /login while whoami ep has not responded yet
  auth: '',
  timezone: '',
  profile: {
    id: 1,
    slug: 'user'
  },
  email: '',
  is_active: true,
  caldav_url: null,
  avatar_url: null,
  created: '',
  public_name: '',
  lang: getBrowserLang()
}

export default function user (state = defaultUser, action) {
  switch (action.type) {
    case `${SET}/${USER_CONNECTED}`:
      return {
        ...state,
        ...action.user,
        lang: action.user.lang ? action.user.lang : state.lang,
        avatar_url: action.user.avatar_url
          ? action.user.avatar_url
          : action.user.public_name ? generateAvatarFromPublicName(action.user.public_name) : ''
      }

    case `${SET}/${USER_DISCONNECTED}`:
      return {...defaultUser, lang: state.lang, logged: false}

    case `${SET}/${USER_LANG}`:
      return {...state, lang: action.lang}

    case `${UPDATE}/${USER_NAME}`:
      return {...state, public_name: action.newName}

    case `${UPDATE}/${USER_EMAIL}`:
      return {...state, email: action.newEmail}

    default:
      return state
  }
}
