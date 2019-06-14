import {
  FETCH_CONFIG,
  ROLE,
  PROFILE,
  STATUSES,
  API_URL,
  SYSTEM_CONFIG,
  DOM_CONTAINER,
  LOGGED_USER
} from 'tracim_frontend_lib'

const workspaceId = 4

const SIDEBAR = [{
  faIcon: 'home',
  hexcolor: '#fdfdfd',
  label: 'Dashboard',
  route: `/ui/workspaces/${workspaceId}/dashboard`,
  slug: 'dashboard'
}, {
  faIcon: 'th',
  hexcolor: '#bbbbbb',
  label: 'All Contents',
  route: `/ui/workspaces/${workspaceId}/contents`,
  slug: 'contents/all'
}, {
  faIcon: 'comments-o',
  hexcolor: '#428BCA',
  label: 'Threads',
  route: `/ui/workspaces/${workspaceId}/contents?type=thread`,
  slug: 'contents/thread'
}, {
  faIcon: 'paperclip',
  hexcolor: '#ffa500',
  label: 'Files',
  route: `/ui/workspaces/${workspaceId}/contents?type=file`,
  slug: 'contents/file'
}, {
  faIcon: 'file-text-o',
  hexcolor: '#00CC00',
  label: 'Text Documents',
  route: `/ui/workspaces/${workspaceId}/contents?type=html-document`,
  slug: 'contents/html-document'
}, {
  faIcon: 'calendar',
  hexcolor: '#ff4b3a',
  label: 'Agenda',
  route: `/ui/workspaces/${workspaceId}/agenda`,
  slug: 'agenda'
}]

export const debug = {
  config: {
    apiHeader: FETCH_CONFIG.headers,
    apiUrl: API_URL,
    availableStatuses: STATUSES,
    profileObject: PROFILE,
    roleList: ROLE,
    system: SYSTEM_CONFIG,
    domContainer: DOM_CONTAINER,
    slug: 'workspace_advanced',
    faIcon: 'bank',
    hexcolor: '#7d4e24',
    creationLabel: '',
    translation: {
      en: {
        translation: {
        }
      },
      fr: {
        translation: {
        }
      }
    },
    label: 'Advanced dashboard'
  },
  content: {
    agendaEnabled: true,
    agendaUrl: `http://192.168.1.121:6543/agenda/workspace/${workspaceId}/`,
    contentReadStatusList: [1, 21, 20, 19, 17, 12, 8, 7, 6, 5, 4, 3, 2],
    description: '',
    id: workspaceId,
    label: 'test1',
    memberList: [{
      doNotify: true,
      id: 1,
      isActive: true,
      publicName: 'Global manager',
      role: 'workspace-manager'
    }],
    recentActivityList: [{
      fileExtension: '.document.html',
      id: 1,
      idParent: null,
      isArchived: false,
      isDeleted: false,
      label: 'a1',
      showInUi: true,
      slug: 'a1',
      statusSlug: 'open',
      subContentTypeSlug: ['comment'],
      type: 'html-document'
    }, {
      fileExtension: '.document.html',
      id: 21,
      idParent: 20,
      isArchived: false,
      isDeleted: false,
      label: 'doc',
      showInUi: true,
      slug: 'doc',
      statusSlug: 'open',
      subContentTypeSlug: ['comment'],
      type: 'html-document'
    }, {
      fileExtension: '',
      id: 20,
      idParent: 19,
      isArchived: false,
      isDeleted: false,
      label: 'subfolder',
      showInUi: true,
      slug: 'subfolder',
      statusSlug: 'open',
      subContentTypeSlug: ['thread', 'file', 'html-document', 'folder', 'comment'],
      type: 'folder'
    }],
    sidebarEntryList: SIDEBAR,
    slug: 'test1',
    workspace_id: workspaceId
  },
  loggedUser: LOGGED_USER
}
