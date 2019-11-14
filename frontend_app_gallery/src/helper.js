import i18n from './i18n.js'

export const removeExtensionOfFilename = filename => filename.split('.').splice(0, (filename.split('.').length - 1)).join('.')

export const getPreviewUrl = (apiUrl, workspaceId, contentId, revisionId, filenameNoExtension, page, height, width) =>
  `${apiUrl}/workspaces/${workspaceId}/files/${contentId}/revisions/${revisionId}/preview/jpg/${height}x${width}/${filenameNoExtension + '.jpg'}?page=1&revision_id=${revisionId}`

export const debug = {
  config: {
    label: 'Admin workspace user',
    slug: 'admin_workspace_user',
    faIcon: 'file-text-o',
    hexcolor: '#7d4e24',
    type: 'user', // 'user' or 'workspace'
    translation: {en: {}, fr: {}},
    apiUrl: 'http://localhost:6543/api/v2',
    apiHeader: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    system: {
      config: {
        email_notification_activated: true
      }
    },
    profileObject: {
      ADMINISTRATOR: {
        id: 1,
        slug: 'administrators',
        faIcon: 'shield',
        hexcolor: '#ed0007',
        label: i18n.t('Administrator')
      },
      MANAGER: {
        id: 2,
        slug: 'trusted-users',
        faIcon: 'graduation-cap',
        hexcolor: '#f2af2d',
        label: i18n.t('Trusted user')
      },
      USER: {
        id: 4,
        slug: 'users',
        faIcon: 'user',
        hexcolor: '#3145f7',
        label: i18n.t('User')
      }
    }
  },
  loggedUser: {
    user_id: 1,
    public_name: 'Global Manager',
    email: 'osef@algoo.fr',
    lang: 'en',
    avatar_url: 'https://avatars3.githubusercontent.com/u/11177014?s=460&v=4'
  },
  content: {
    workspaceList: [],
    userList: []
  }
}
