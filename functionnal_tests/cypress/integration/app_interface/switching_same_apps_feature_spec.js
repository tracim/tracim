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

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id

      // FIXME -  B.L - 2019/05/03 - when we send simultaneous request to create contents we
      // end up with an undefined response we need to dig up to find if it's the server or cypress
      // Issue 1836
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
    cy.visitPage({ pageName: p.CONTENTS, params: { workspaceId: workspaceId } })
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe('From File to File', () => {
    it('should close first file and open the second one', () => {
      cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileTitle } })
        .find('.content__item')
        .click('left')

      cy.getTag({ selectorName: s.CONTENT_FRAME }).contains(fileTitle)
      cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: anotherFileTitle } })
        .find('.content__item')
        .click('left')

      cy.getTag({ selectorName: s.CONTENT_FRAME }).contains(anotherFileTitle)
    })
  })

  describe('From HtmlDoc to HtmlDoc', () => {
    it('should close first file and open the second one', () => {
      cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: htmlDocTitle } })
        .find('.content__item')
        .click('left')

      cy.getTag({ selectorName: s.CONTENT_FRAME }).contains(htmlDocTitle)
      cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: anotherHtmlDocTitle } })
        .find('.content__item')
        .click('left')

      cy.getTag({ selectorName: s.CONTENT_FRAME }).contains(anotherHtmlDocTitle)
    })
  })

  describe('From Thread to Thread', () => {
    it('should close first file and open the second one', () => {
      cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: threadTitle } })
        .find('.content__item')
        .click('left')

      cy.getTag({ selectorName: s.CONTENT_FRAME }).contains(threadTitle)
      cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: anotherThreadTitle } })
        .find('.content__item')
        .click('left')

      cy.getTag({ selectorName: s.CONTENT_FRAME }).contains(anotherThreadTitle)
    })
  })
})
