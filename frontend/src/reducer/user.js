import {
  SET,
  UPDATE,
  USER,
  USER_CONFIGURATION,
  USER_CONNECTED,
  USER_DISCONNECTED,
  USER_LANG,
  USER_AGENDA_URL
} from '../action-creator.sync.js'
import { getBrowserLang } from '../util/helper.js'
import { PROFILE, serialize } from 'tracim_frontend_lib'

export const serializeUserProps = {
  config: 'config',
  user_id: 'userId',
  logged: 'logged',
  auth_type: 'authType',
  timezone: 'timezone',
  profile: 'profile',
  email: 'email',
  is_active: 'isActive',
  avatar_url: 'avatarUrl',
  created: 'created',
  public_name: 'publicName',
  lang: 'lang',
  agendaUrl: 'agendaUrl',
  username: 'username',
  is_deleted: 'isDeleted'
}

export const defaultUser = {
  config: {},
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
        ...serialize(action.user, serializeUserProps),
        lang: action.user.lang || state.lang
      }

    case `${SET}/${USER_DISCONNECTED}`:
      return { ...defaultUser, lang: state.lang, logged: false }

    case `${SET}/${USER_LANG}`:
      return { ...state, lang: action.lang }

    case `${UPDATE}/${USER}`:
      if (action.newUser.user_id !== state.userId) return state
      return {
        ...state,
        ...serialize(action.newUser, serializeUserProps),
        lang: action.newUser.lang || state.lang
      }

    case `${SET}/${USER_AGENDA_URL}`:
      return { ...state, agendaUrl: action.newAgendaUrl }

    case `${SET}/${USER_CONFIGURATION}`:
      return { ...state, config: action.userConfig }

    default:
      return state
  }
}
