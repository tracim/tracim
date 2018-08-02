import {
  SET,
  UPDATE,
  USER_CONNECTED,
  USER_DISCONNECTED,
  USER_DATA,
  USER_LANG
} from '../action-creator.sync.js'

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
  lang: 'en' // @FIXME Côme - 2018/07/30 - remove this line when api returns the lang (https://github.com/tracim/tracim/issues/734)
}

export default function user (state = defaultUser, action) {
  switch (action.type) {
    case `${SET}/${USER_CONNECTED}`:
      return {
        ...state,
        ...action.user,
        avatar_url: 'https://www.algoo.fr/static/images/people_images/PERSO_SEUL.png' // @FIXME use avatar from api when db handles it
      }

    case `${SET}/${USER_DISCONNECTED}`:
      return defaultUser

    case `${UPDATE}/${USER_DATA}`:
      return {...state, ...action.data}

    case `${SET}/${USER_LANG}`:
      return {...state, lang: action.lang}

    default:
      return state
  }
}
