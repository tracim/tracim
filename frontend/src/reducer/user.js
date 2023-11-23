import {
  SET,
  USER_CONFIGURATION,
  USER_CONNECTED,
  USER_DISCONNECTED,
  USER_LANG,
  USER_AGENDA_URL,
  USER_PROFILE_AVATAR_NAME,
  USER_PROFILE_COVER_NAME,
  UPDATE_USER
} from '../action-creator.sync.js'
import {
  getBrowserLang,
  PROFILE,
  serialize
} from 'tracim_frontend_lib'

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

    case UPDATE_USER:
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

// INFO - CH - 2023-11-08 - Attributes bellow are possibly read only depending on auth type
// Whether they are read only will be set by reducer system.config.user__read_only_fields[auth_type]
// which value comes from backend (/api/system/config)
// This object must stay synced with backend/tracim_backend/config.py class UserReadOnlyFields
export const UserReadOnlyFields = {
  PUBLIC_NAME: 'publicName',
  USERNAME: 'username',
  EMAIL: 'email',
  PASSWORD: 'password'
}
