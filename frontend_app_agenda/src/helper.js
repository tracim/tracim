import { PROFILE } from 'tracim_frontend_lib'

export const getUserProfile = (profileObj, slug) => Object.keys(profileObj).map(p => profileObj[p]).find(p => slug === p.slug) || {}

export const debug = {
  config: {
    label: 'Admin workspace user',
    slug: 'admin_workspace_user',
    faIcon: 'file-text-o',
    hexcolor: '#7d4e24',
    type: 'user', // 'user' or 'workspace'
    translation: { en: {}, fr: {} },
    apiUrl: 'http://localhost:6543/api/v2',
    apiHeader: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    system: {
      config: {
        email_notification_activated: true
      }
    },
    profileObject: PROFILE
  },
  loggedUser: {
    userId: 1,
    publicName: 'Global Manager',
    username: 'global_manager',
    email: 'osef@algoo.fr',
    lang: 'en',
    avatarUrl: 'https://avatars3.githubusercontent.com/u/11177014?s=460&v=4'
  },
  content: {
    workspaceList: [],
    userList: []
  }
}
