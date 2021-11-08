const SELECTORS = {
  ADMIN_USER_PAGE: 'adminUserPage',
  CARD_POPUP_BODY: 'cardPopupBody',
  CONTENT_FRAME: 'contentFrame',
  CONTENT_IN_LIST: 'contentInList',
  CONTENT_IN_SEARCH: 'contentInSearch',
  FLASH_MESSAGE: 'flashMessage',
  FLASH_TYPE: 'flashType',
  FOLDER_IN_LIST: 'folderInList',
  GALLERY_FRAME: 'galleryFrame',
  HEADER: 'header',
  LOGIN_PAGE_MAIN: 'loginPageMain',
  TRACIM_CONTENT: 'tracimContent',
  SIDEBAR_ARROW: 'sidebarArrow',
  WORKSPACE_ADVANCED_USER_DELETE: 'workspaceAdvancedUserDelete',
  WORKSPACE_DASHBOARD: 'workspaceDashboard',
  WORKSPACE_MENU: 'workspaceMenu',
}

const TAGS = {
  [SELECTORS.ADMIN_USER_PAGE]: () => '.adminUser.pageContentGeneric',
  [SELECTORS.CARD_POPUP_BODY]: () => '.cardPopup__body',
  [SELECTORS.CONTENT_FRAME]: () => '[data-cy="popinFixed"]',
  [SELECTORS.CONTENT_IN_LIST]: ({ read }) => `.workspace__content__fileandfolder > .content${read ? '.read' : ''}`,
  [SELECTORS.CONTENT_IN_SEARCH]: () => '.FilenameWithExtension',
  [SELECTORS.FLASH_MESSAGE]: () => '[data-cy="flashmessage"]',
  [SELECTORS.FLASH_TYPE]: () => `.flashmessage__container__header`,
  [SELECTORS.FOLDER_IN_LIST]: ({ folderId }) => `[data-cy=folder_${folderId}]`,
  [SELECTORS.GALLERY_FRAME]: () => '.gallery.pageWrapperGeneric',
  [SELECTORS.HEADER]: () => '.header',
  [SELECTORS.LOGIN_PAGE_MAIN]: () => '.loginpage__main',
  [SELECTORS.TRACIM_CONTENT]: () => '.tracim__content-scrollview',
  [SELECTORS.SIDEBAR_ARROW]: () => '.sidebar__expand > i',
  [SELECTORS.WORKSPACE_ADVANCED_USER_DELETE]: () => '[data-cy=userlist_delete]',
  [SELECTORS.WORKSPACE_DASHBOARD]: () => '.dashboard.pageWrapperGeneric',
  [SELECTORS.WORKSPACE_MENU]: ({ workspaceId }) => `[data-cy=sidebar__content__navigation__workspace__item_${workspaceId}]`,
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
