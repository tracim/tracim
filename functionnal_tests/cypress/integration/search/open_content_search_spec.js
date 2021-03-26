import { PAGES } from '../../support/urls_commands'
import { SELECTORS as s, formatTag } from '../../support/generic_selector_commands'

const htmlDocTitle = 'HtmlDocForSearch'
const threadTitle = 'ThreadForSearch'
const fileTitle = 'FileForSearch'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'

const searchInput = '[data-cy=search__text]'
const contentThreadGetter = formatTag({ selectorName: s.CONTENT_IN_SEARCH, attrs: { title: threadTitle } })
const contentHtmlDocGetter = formatTag({ selectorName: s.CONTENT_IN_SEARCH, attrs: { title: htmlDocTitle } })
const contentFileGetter = formatTag({ selectorName: s.CONTENT_IN_SEARCH, attrs: { title: fileTitle } })

let workspaceId

describe('Searching keywords', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId)
      cy.createHtmlDocument(htmlDocTitle, workspaceId)
      cy.createThread(threadTitle, workspaceId)
    })
    cy.logout()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
    cy.ignoreTinyMceError()
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe('and clicking on a thread result', () => {
    it('Should redirect to the content page', () => {
      cy.get(searchInput).type(threadTitle).type('{enter}')

      cy.get(contentThreadGetter).click()

      cy.url().should('include', `/workspaces/${workspaceId}/contents/thread/`)
      cy.contains('.FilenameWithExtension', threadTitle).should('be.visible')
    })
  })

  describe('and clicking on a file result', () => {
    it('Should redirect to the content page', () => {
      cy.get(searchInput).type(fileTitle).type('{enter}')

      cy.get(contentFileGetter).click()

      cy.url().should('include', `/workspaces/${workspaceId}/contents/file/`)
      cy.contains('.FilenameWithExtension', fileTitle).should('be.visible')
    })
  })

  describe('and clicking on a html-document result', () => {
    it('Should redirect to the content page', () => {
      cy.get(searchInput).type(htmlDocTitle).type('{enter}')

      cy.get(contentHtmlDocGetter).click()

      cy.url().should('include', `/workspaces/${workspaceId}/contents/html-document/`)
      cy.contains('.FilenameWithExtension', htmlDocTitle).should('be.visible')
    })
  })
})
