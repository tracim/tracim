import i18n from './i18n.js'

export const FETCH_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
}

export const debug = {
  config: {
    label: 'Workspace Advanced',
    slug: 'workspace_advanced',
    faIcon: 'bank',
    hexcolor: '#999999',
    creationLabel: '',
    domContainer: 'appFeatureContainer',
    apiUrl: 'http://localhost:6543/api/v2',
    availableStatuses: [{
      label: 'Open',
      slug: 'open',
      faIcon: 'square-o',
      hexcolor: '#3f52e3',
      globalStatus: 'open'
    }, {
      label: 'Validated',
      slug: 'closed-validated',
      faIcon: 'check-square-o',
      hexcolor: '#008000',
      globalStatus: 'closed'
    }, {
      label: 'Cancelled',
      slug: 'closed-unvalidated',
      faIcon: 'close',
      hexcolor: '#f63434',
      globalStatus: 'closed'
    }, {
      label: 'Deprecated',
      slug: 'closed-deprecated',
      faIcon: 'warning',
      hexcolor: '#ababab',
      globalStatus: 'closed'
    }],
    roleList: [{ // this is the same as ROLE from frontend
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
      label: i18n.t('Shared space manager')
    }],
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
    },
    translation: {
      en: {
        translation: {
          'Last version': 'Last version debug en'
        }
      },
      fr: {
        translation: {
          'Last version': 'Dernière version debug fr'
        }
      }
    }
  },
  loggedUser: { // @FIXME this object is outdated
    user_id: 1,
    username: 'Smoi',
    firstname: 'Côme',
    lastname: 'Stoilenom',
    email: 'osef@algoo.fr',
    lang: 'en',
    avatar_url: 'https://avatars3.githubusercontent.com/u/11177014?s=460&v=4',
    auth: btoa(`${'admin@admin.admin'}:${'admin@admin.admin'}`),
    idRoleUserWorkspace: 8
  },
  content: {
    label: 'Bonjour',
    sidebar_entries: [
      {
        hexcolor: '#252525',
        route: '/#/workspaces/1/dashboard',
        slug: 'dashboard',
        label: 'Dashboard',
        fa_icon: 'home'
      },
      {
        hexcolor: '#fdfdfd',
        route: '/#/workspaces/1/contents',
        slug: 'contents/all',
        label: 'All Contents',
        fa_icon: 'th'
      },
      {
        hexcolor: '#3f52e3',
        route: '/#/workspaces/1/contents?type=html-document',
        slug: 'contents/html-document',
        label: 'Text Documents',
        fa_icon: 'file-text-o'
      },
      {
        hexcolor: '#ff9900',
        route: '/#/workspaces/1/contents?type=file',
        slug: 'contents/file',
        label: 'Files',
        fa_icon: 'paperclip'
      },
      {
        hexcolor: '#ad4cf9',
        route: '/#/workspaces/1/contents?type=thread',
        slug: 'contents/thread',
        label: 'Threads',
        fa_icon: 'comments-o'
      }
    ],
    description: '',
    is_deleted: false,
    slug: 'bonjour',
    workspace_id: 1
  }
}
