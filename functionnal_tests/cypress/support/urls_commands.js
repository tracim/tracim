const PAGES = {
  FEED: 'feed',
  HOME: 'home',
  LOGIN: 'login',
  CONTENTS: 'contents',
  DASHBOARD: 'dashboard',
  AGENDA: 'agenda',
  EDIT_FOLDER: 'editFolder',
  SEARCH: 'search',
  ADMIN_WORKSPACE: 'adminWorkspace',
  ADMIN_USER: 'adminUser',
  SHARE_FOLDER: 'share_folder',
  GALLERY: 'gallery',
  CONTENT_OPEN: 'contentOpen',
  ACCOUNT: 'account',
  JOIN_WORKSPACE: 'join-workspace'
}

const URLS = {
  [PAGES.FEED]: ({ workspaceId }) => `/ui/workspaces/${workspaceId}/feed`,
  [PAGES.HOME]: () => '/ui',
  [PAGES.LOGIN]: ({ loginParam }) => `/ui/login${loginParam}`,
  [PAGES.CONTENTS]: ({ workspaceId }) => `/ui/workspaces/${workspaceId}/contents/`,
  [PAGES.CONTENT_OPEN]: ({ workspaceId, contentType, contentId }) => `/ui/workspaces/${workspaceId}/contents/${contentType}/${contentId}`,
  [PAGES.DASHBOARD]: ({ workspaceId }) => `/ui/workspaces/${workspaceId}/dashboard/`,
  [PAGES.AGENDA]: ({ workspaceId }) => `/ui/workspaces/${workspaceId}/agenda/`,
  [PAGES.EDIT_FOLDER]: ({ workspaceId, folderId }) => `/ui/workspaces/${workspaceId}/contents/folder/${folderId}`,
  [PAGES.SEARCH]: ({ searchedKeywords, pageNumber, numberByPage, actived, deleted, archived, contentTypes }) => `/ui/search-result?act=${actived}&arc=${archived}&del=${deleted}&nr=${numberByPage}&p=${pageNumber}&q=${searchedKeywords}&t=${contentTypes}`,
  [PAGES.SHARE_FOLDER]: ({ workspaceId }) => `/ui/workspaces/${workspaceId}/contents/share_folder`,
  [PAGES.ADMIN_WORKSPACE]: () => '/ui/admin/workspace',
  [PAGES.ADMIN_USER]: ({ userId }) => `/ui/admin/user/${userId || ''}`,
  [PAGES.GALLERY]: ({ workspaceId, folderId }) => `/ui/workspaces/${workspaceId}/gallery` + (folderId ? `?folder_ids=${folderId}` : '/'),
  [PAGES.ACCOUNT]: () => '/ui/account',
  [PAGES.JOIN_WORKSPACE]: () => '/ui/join-workspace'
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

Cypress.Commands.add('visitPage', ({ pageName, params = {}, getters = null }) => {
  const url = formatUrl({ pageName: pageName, params: params, getters: getters })
  return cy.visit(url)
})
export { PAGES, reverseUrl, formatUrl }

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
