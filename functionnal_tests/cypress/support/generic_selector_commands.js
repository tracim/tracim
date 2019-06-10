const SELECTORS = {
  CONTENT_FRAME: 'contentFrame',
  CONTENT_IN_LIST: 'contentInList',
  WORKSPACE_MENU: 'workspaceMenu',
  CONTENT_IN_RESEARCH: 'contentInResearch'
}

const TAGS = {
  [SELECTORS.CONTENT_FRAME]: () => '[data-cy="popinFixed"]',
  [SELECTORS.CONTENT_IN_LIST]: () => `.content__item`,
  [SELECTORS.CONTENT_IN_RESEARCH]: () => `.content__name`,
  [SELECTORS.WORKSPACE_MENU]: ({ workspaceId }) => `[data-cy=sidebar__content__navigation__workspace__item_${workspaceId}]`
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
