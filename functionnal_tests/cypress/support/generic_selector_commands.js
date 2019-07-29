const SELECTORS = {
  CONTENT_FRAME: 'contentFrame',
  CONTENT_IN_LIST: 'contentInList',
  FOLDER_IN_LIST: 'folderInList',
  WORKSPACE_MENU: 'workspaceMenu',
  CONTENT_IN_SEARCH: 'contentInSearch',
  WORKSPACE_DASHBOARD: 'workspaceDashboard',
  TRACIM_CONTENT: 'tracimContent'
}

const TAGS = {
  [SELECTORS.CONTENT_FRAME]: () => '[data-cy="popinFixed"]',
  [SELECTORS.CONTENT_IN_LIST]: () => `.workspace__content__fileandfolder > .content`,
  [SELECTORS.CONTENT_IN_SEARCH]: () => `.content__name`,
  [SELECTORS.FOLDER_IN_LIST]: ({ folderId }) => `[data-cy=folder_${folderId}]`,
  [SELECTORS.WORKSPACE_MENU]: ({ workspaceId }) => `[data-cy=sidebar__content__navigation__workspace__item_${workspaceId}]`,
  [SELECTORS.WORKSPACE_DASHBOARD]: () => '.dashboard.pageWrapperGeneric',
  [SELECTORS.TRACIM_CONTENT]: () => `.tracim__content-scrollview`
}

/**
  * Generate a lazy html tag.
  * @param {selectorName} selectorName: key of the tag mapped in TAGS.
 */
const reverseTag = (selectorName) => {
  if (!(selectorName in TAGS)) {
    throw `No selector found for selector name ${selectorName}`
  }
  return TAGS[selectorName]
}

/**
  * Format a url for a given pageName mapped in URLS and applies getters at the end.
  * @param {string} selectorName: key of the tag mapped in TAGS.
  * @param {Object} param: object containing the key/value to use on the lazy tag.
  * @param {Object} attrs: object containing the key/value to format html attrs selector.
 */
const formatTag = ({ selectorName, params = {}, attrs = null }) => {
  let tag = reverseTag(selectorName)(params)
  if (attrs) {
    Object.entries(attrs).forEach(([key, value]) => tag += `[${key}="${value}"]`)
  }
  return tag
}

Cypress.Commands.add('getTag', ({ selectorName, params = {}, attrs = null }) => {
  return cy.get(formatTag({ selectorName: selectorName, params: params, attrs: attrs }))
})

export { SELECTORS, formatTag, reverseTag }
