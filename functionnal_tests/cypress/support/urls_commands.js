const PAGES = {
  HOME: 'home',
  LOGIN: 'login',
  CONTENTS: 'contents',
  DASHBOARD: 'dashboard',
  ADVANCED_DASHBOARD: 'advancedDashboard',
  AGENDA: 'agenda',
  EDIT_FOLDER: 'editFolder',
  SEARCH: 'search',
  ADMIN_WORKSPACE: 'adminWorkspace',
  ADMIN_USER: 'adminUser',
  SHARE_FOLDER: 'share_folder',
  GALLERY: 'gallery',
  CONTENT_OPEN: 'contentOpen',
  ACCOUNT: 'account',
  JOIN_WORKSPACE: 'join-workspace',
  RECENT_ACTIVITIES: 'recent-activities',
  PUBLICATION: 'publication',
  PROFILE: 'profile',
  WORKSPACE_RECENT_ACTIVITIES: 'workspaceRecentActivities',
  FAVORITES: 'favorites'
}

const URLS = {
  [PAGES.HOME]: () => '/ui',
  [PAGES.LOGIN]: ({ loginParam }) => `/ui/login${loginParam}`,
  [PAGES.CONTENTS]: ({ workspaceId }) => `/ui/workspaces/${workspaceId}/contents/`,
  [PAGES.CONTENT_OPEN]: ({ contentId }) => `/ui/contents/${contentId}`,
  [PAGES.DASHBOARD]: ({ workspaceId }) => `/ui/workspaces/${workspaceId}/dashboard/`,
  [PAGES.ADVANCED_DASHBOARD]: ({ workspaceId }) => `/ui/workspaces/${workspaceId}/advanced_dashboard`,
  [PAGES.WORKSPACE_RECENT_ACTIVITIES]: ({ workspaceId }) => `/ui/workspaces/${workspaceId}/recent-activities/`,
  [PAGES.AGENDA]: ({ workspaceId }) => `/ui/workspaces/${workspaceId}/agenda/`,
  [PAGES.EDIT_FOLDER]: ({ workspaceId, folderId }) => `/ui/workspaces/${workspaceId}/contents/folder/${folderId}`,
  [PAGES.SEARCH]: ({ searchString, pageNumber, numberByPage, actived, deleted, archived, contentTypes }) => `/ui/search-result?act=${actived}&arc=${archived}&del=${deleted}&nr=${numberByPage}&p=${pageNumber}&q=${searchString}&t=${contentTypes}`,
  [PAGES.SHARE_FOLDER]: ({ workspaceId }) => `/ui/workspaces/${workspaceId}/contents/share_folder`,
  [PAGES.ADMIN_WORKSPACE]: () => '/ui/admin/workspace',
  [PAGES.ADMIN_USER]: ({ userId }) => `/ui/admin/user/${userId || ''}`,
  [PAGES.GALLERY]: ({ workspaceId, folderId }) => `/ui/workspaces/${workspaceId}/gallery` + (folderId ? `?folder_ids=${folderId}` : '/'),
  [PAGES.ACCOUNT]: () => '/ui/account',
  [PAGES.JOIN_WORKSPACE]: () => '/ui/join-workspace',
  [PAGES.RECENT_ACTIVITIES]: () => '/ui/recent-activities',
  [PAGES.PUBLICATION]: ({ workspaceId }) => `/ui/workspaces/${workspaceId}/publications`,
  [PAGES.PROFILE]: ({ userId }) => `/ui/users/${userId}/profile`,
  [PAGES.FAVORITES]: () => 'ui/favorites'
}

/**
  * Generate a lazy url.
  * @param {string} pageName: key of the url mapped in URLS.
 */
const reverseUrl = (pageName) => {
  if (!(pageName in URLS)) {
    throw `No page found for page name ${pageName}`
  }
  return URLS[pageName]
}

/**
  * Format a url for a given pageName mapped in URLS and applies getters at the end.
  * @param {string} pageName: key of the url mapped in URLS.
  * @param {Object} param: object containing the key/value to use on the lazy url.
  * @param {Object} getters: object containing the key/value to format the GET paramaters.
 */
const formatUrl = ({ pageName, params = {}, getters = null }) => {
  let url = reverseUrl(pageName)(params)
  if (getters) {
    url += '?'
    Object.keys(getters).forEach((key, index, array) => {
      url += `${key}=${getters[key]}`
      if (index !== array.length - 1) {
        url += '&'
      }
    })
  }
  return url
}

// NOTE SG - 2020-11-12: these must be kept in sync with the real definitions
// in frontend_lib/src/customEvent.js
const TRACIM_LIVE_MESSAGE_STATUS_CHANGED = 'TracimLiveMessageStatusChanged'
const APP_CUSTOM_EVENT_LISTENER = 'appCustomEventListener'
// Same here with LiveMessagesManager.js
const OPENED_LIVE_MESSAGE_STATUS = 'opened'
Cypress.Commands.add('visitAndWaitForTlmConnection', (url, options = {}) => {
  const tlm = { opened: false }

  const signalOpenedTlmConnection = (win) => {
    if (options.onBeforeLoad) options.onBeforeLoad(win)
    win.document.addEventListener(APP_CUSTOM_EVENT_LISTENER, (event) => {
      if (tlm.opened) return
      tlm.opened = (
        event.type === APP_CUSTOM_EVENT_LISTENER &&
        event.detail.type === TRACIM_LIVE_MESSAGE_STATUS_CHANGED &&
        event.detail.data &&
        event.detail.data.status === OPENED_LIVE_MESSAGE_STATUS
      )
    })
  }

  cy.visit(url, {
    ...options,
    onBeforeLoad: signalOpenedTlmConnection
  }).then(() => {
    return new Cypress.Promise((resolve, reject) => {
      const isTlmConnectionOpened = () => {
        if (tlm.opened) return resolve()
        setTimeout(isTlmConnectionOpened, 10)
      }
      isTlmConnectionOpened()
    })
  })
})

Cypress.Commands.add('visitPage', ({
  pageName,
  params = {},
  getters = null,
  waitForTlm = false,
  options = undefined
}) => {
  const url = formatUrl({ pageName: pageName, params: params, getters: getters })
  if (waitForTlm) return cy.visitAndWaitForTlmConnection(url, options)
  return cy.visit(url, options)
})
export { PAGES, URLS, reverseUrl, formatUrl }

/*
EXAMPLES

To replace basic Cypress `visit`` use `visitPage` instead:

```
import { PAGES as p } from '../../support/urls_commands'

cy.visit('/ui')
=>
cy.visitPage({pageName: p.HOME})

cy.visit('/ui/worspaces/1/dashboard')
=>
cy.visitPage({pageName: p.DASHBOARD, params: {workspaceId: 1}})

cy.visit('/ui/workspaces/1/contents?type=file')
=>
cy.visitPage({ pageName: p.CONTENTS, getters: { type: 'file' }, params: { workspaceId: 1 } })

```

-----

If you want only the url string:

formatUrl({pageName: PAGES.CONTENTS, getters: {type: 'file'}, param: {workspaceId: 1}})
> '/ui/workspaces/1/contents?type=file'

----

If you need a lazy url to be formatted later

const lazyContentUrl = reverseUrl(PAGES.CONTENTS)
const workspace1Url = lazyContentUrl({workspaceId: 1})
> '/ui/workspaces/1/contents'
const workspace2Url = lazyContentUrl({workspaceId: 2})
> '/ui/workspaces/2/contents'
*/
