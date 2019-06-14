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

export const debug = {
  config: {
    apiHeader: FETCH_CONFIG.headers,
    apiUrl: API_URL,
    availableStatuses: STATUSES,
    profileObject: PROFILE,
    roleList: ROLE,
    system: SYSTEM_CONFIG,
    domContainer: DOM_CONTAINER,
    slug: 'thread',
    faIcon: 'comments-o',
    hexcolor: '#428BCA',
    creationLabel: 'Start a topic',
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
    label: 'Thread'
  },
  content: {
    content_id: 23,
    content_type: 'thread',
    workspace_id: 5
  },
  loggedUser: LOGGED_USER
}
