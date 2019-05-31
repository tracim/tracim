import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

describe('Hot switching between the same app', () => {
  const htmlDocTitle = 'first Html Doc'
  const threadTitle = 'first Thread'
  const fileTitle = 'first File'
  const fullFilename = 'Linux-Free-PNG.png'
  const contentType = 'image/png'

  const anotherHtmlDocTitle = 'second Html Doc'
  const anotherThreadTitle = 'second Thread'
  const anotherFileTitle = 'second File'

  let workspaceId

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id

      cy.createHtmlDocument(htmlDocTitle, workspaceId)
      cy.createThread(threadTitle, workspaceId)
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId)

      cy.createHtmlDocument(anotherHtmlDocTitle, workspaceId)
      cy.createThread(anotherThreadTitle, workspaceId)
      cy.createFile(fullFilename, contentType, anotherFileTitle, workspaceId)
    })
  })

  beforeEach(() => {
    cy.ignoreTinyMceError()
    cy.loginAs('administrators')
    cy.visitPage({pageName: p.CONTENTS, params: {workspaceId: workspaceId}})
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe('From File to File', () => {
    it('should close first file and open the second one', () => {
      cy.getTag({selectorName: s.CONTENT_IN_LIST, attrs: {title: fileTitle}}).click('left')
      cy.getTag({selectorName: s.CONTENT_FRAME}).contains(fileTitle)
      cy.getTag({selectorName: s.CONTENT_IN_LIST, attrs: {title: anotherFileTitle}}).click('left')
      cy.getTag({selectorName: s.CONTENT_FRAME}).contains(anotherFileTitle)
    })
  })

  describe('From HtmlDoc to HtmlDoc', () => {
    it('should close first file and open the second one', () => {
      cy.getTag({selectorName: s.CONTENT_IN_LIST, attrs: {title: htmlDocTitle}}).click('left')
      cy.getTag({selectorName: s.CONTENT_FRAME}).contains(htmlDocTitle)
      cy.getTag({selectorName: s.CONTENT_IN_LIST, attrs: {title: anotherHtmlDocTitle}}).click('left')
      cy.getTag({selectorName: s.CONTENT_FRAME}).contains(anotherHtmlDocTitle)
    })
  })

    describe('From Thread to Thread', () => {
    it('should close first file and open the second one', () => {
      cy.getTag({selectorName: s.CONTENT_IN_LIST, attrs: {title: threadTitle}}).click('left')
      cy.getTag({selectorName: s.CONTENT_FRAME}).contains(threadTitle)
      cy.getTag({selectorName: s.CONTENT_IN_LIST, attrs: {title: anotherThreadTitle}}).click('left')
      cy.getTag({selectorName: s.CONTENT_FRAME}).contains(anotherThreadTitle)
    })
  })

})
