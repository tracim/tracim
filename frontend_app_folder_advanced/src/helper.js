import i18n from './i18n.js'

export const FETCH_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
}

export const debug = {
  config: {
    label: 'Folder Advanced',
    slug: 'folder_advanced',
    faIcon: 'bank',
    hexcolor: '#999999',
    creationLabel: '',
    domContainer: 'appFeatureContainer',
    apiUrl: 'http://192.168.1.153:6543/api/v2',
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
    system: {},
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
        translation: {}
      },
      fr: {
        translation: {}
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
    idRoleUserWorkspace: 8
  },
  content: {
    content_id: 59,
    workspace_id: 16
  }
}
