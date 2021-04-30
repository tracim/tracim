import {
  SET,
  UPDATE,
  USER,
  USER_CONFIGURATION,
  USER_CONNECTED,
  USER_DISCONNECTED,
  USER_LANG,
  USER_AGENDA_URL,
  USER_PROFILE_AVATAR_NAME,
  USER_PROFILE_COVER_NAME
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
  allowed_space: 'allowedSpace',
  is_deleted: 'isDeleted',
  has_avatar: 'hasAvatar',
  has_cover: 'hasCover',
  profileAvatarName: 'profileAvatarName',
  profileCoverName: 'profileCoverName'
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
  username: '',
  hasAvatar: false,
  hasCover: false,
  profileAvatarName: 'avatar',
  profileCoverName: 'cover'
}

export default function user (state = defaultUser, action) {
  switch (action.type) {
    case `${SET}/${USER_CONNECTED}`: {
      const user = action.user.userId ? action.user : serialize(action.user, serializeUserProps)
      return {
        ...state,
        ...user,
        lang: action.user.lang || state.lang
      }
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

    case `${SET}/${USER_PROFILE_AVATAR_NAME}`:
      return { ...state, profileAvatarName: action.newAvatarName }

    case `${SET}/${USER_PROFILE_COVER_NAME}`:
      return { ...state, profileCoverName: action.newCoverName }

    default:
      return state
  }
}
