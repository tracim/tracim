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
    slug: 'html-document',
    faIcon: 'file-text-o',
    hexcolor: '#00CC00',
    creationLabel: 'Write a document',
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
    label: 'Text Document'
  },
  content: {
    content_id: 1,
    content_type: 'file',
    workspace_id: 2
  },
  loggedUser: LOGGED_USER
}
