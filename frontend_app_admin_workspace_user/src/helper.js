import i18n from './i18n.js'

export const FETCH_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
}

export const ROLE = [{
  id: 1,
  slug: 'reader',
  faIcon: 'eye',
  hexcolor: '#15d948',
  label: i18n.t('Reader')
}, {
  id: 2,
  slug: 'contributor',
  faIcon: 'pencil',
  hexcolor: '#3145f7',
  label: i18n.t('Contributor')
}, {
  id: 4,
  slug: 'content-manager',
  faIcon: 'graduation-cap',
  hexcolor: '#f2af2d',
  label: i18n.t('Content manager')
}, {
  id: 8,
  slug: 'workspace-manager',
  faIcon: 'gavel',
  hexcolor: '#ed0007',
  label: i18n.t('Workspace manager')
}]

export const debug = {
  config: {
    label: 'Admin workspace user',
    slug: 'admin_workspace_user',
    faIcon: 'file-text-o',
    hexcolor: '#7d4e24',
    type: 'workspace', // 'user' or 'workspace'
    translation: {en: {}, fr: {}},
    apiUrl: 'http://localhost:6543/api/v2',
    apiHeader: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
      // 'Authorization': 'Basic ' + btoa(`${'admin@admin.admin'}:${'admin@admin.admin'}`)
    }
  },
  loggedUser: {
    user_id: 1,
    public_name: 'Global Manager',
    email: 'osef@algoo.fr',
    lang: 'en',
    avatar_url: 'https://avatars3.githubusercontent.com/u/11177014?s=460&v=4',
    auth: btoa(`${'admin@admin.admin'}:${'admin@admin.admin'}`)
  },
  content: {
    profile: {
      ADMINISTRATOR: {
        id: 1,
        slug: 'administrators',
        faIcon: 'rocket',
        hexcolor: '#123456',
        label: i18n.t('Administrator')
      },
      MANAGER: {
        id: 2,
        slug: 'managers',
        faIcon: 'car',
        hexcolor: '#654321',
        label: i18n.t('Manager')
      },
      USER: {
        id: 4,
        slug: 'users',
        faIcon: 'bicycle',
        hexcolor: '#123123',
        label: i18n.t('User')
      }
    },
    workspaceList: [],
    userList: []
  }
}
