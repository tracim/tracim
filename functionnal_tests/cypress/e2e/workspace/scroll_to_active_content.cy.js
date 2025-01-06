import { PAGES as p } from '../../support/urls_commands'
import { SELECTORS as s } from '../../support/generic_selector_commands'

// FIXME - GB - 2021-12-07 - Test from a bugged feature that should be fixed before
// See https://github.com/tracim/tracim/issues/5125
describe.skip('Scroll to active content when refreshing the page', () => {
  let workspaceId
  const contentTitle = 'content '
  const nbContent = 20
  let lastFolder
  let firstFolder

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createHtmlDocument(contentTitle + 0, workspaceId)
      cy.createFolder(contentTitle + 0, workspaceId).then(f => (firstFolder = f))
      for (let i = 1; i < nbContent; i++) {
        cy.createHtmlDocument(contentTitle + i, workspaceId)
        cy.createFolder(contentTitle + i, workspaceId)
      }
      cy.createHtmlDocument(contentTitle + nbContent, workspaceId)
      cy.createFolder(contentTitle + nbContent, workspaceId).then(f => (lastFolder = f))
    })
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visitPage({ pageName: p.CONTENTS, params: { workspaceId: workspaceId } })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('Open a content', () => {
    describe('Open a file', () => {
      it('should scroll to file when refreshing the page', () => {
        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: contentTitle + nbContent } })
          .find('.content__item')
          .click()

        cy.reload()

        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: contentTitle + nbContent } })
          .find('.content__item')
          .should('be.visible')

        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: contentTitle + 0 } })
          .find('.content__item')
          .should('be.not.visible')
      })
    })

    describe('Open a folder', () => {
      it('should scroll to folder when refreshing the page', () => {
        cy.getTag({selectorName: s.FOLDER_IN_LIST, params: {folderId: lastFolder.content_id}})
          .find('.folder__header__name')
          .click()

        cy.reload()

        cy.getTag({selectorName: s.FOLDER_IN_LIST, params: {folderId: lastFolder.content_id}})
          .find('.folder__header__name')
          .should('be.visible')

        cy.getTag({selectorName: s.FOLDER_IN_LIST, params: {folderId: firstFolder.content_id}})
          .find('.folder__header__name')
          .should('be.not.visible')
      })
    })

    describe('Open a file when a folder is open', () => {
      it('should scroll to file and not folder when refreshing the page', () => {
        cy.getTag({ selectorName: s.FOLDER_IN_LIST, params: { folderId: firstFolder.content_id } })
          .find('.folder__header__name')
          .click()

        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: contentTitle + nbContent } })
          .find('.content__item')
          .click()

        cy.reload()

        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: contentTitle + nbContent } })
          .find('.content__item')
          .should('be.visible')

        cy.getTag({ selectorName: s.FOLDER_IN_LIST, params: { folderId: firstFolder.content_id } })
          .find('.folder__header__name')
          .should('be.not.visible')
      })
    })
  })
})
