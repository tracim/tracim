import { PAGES as p } from '../../support/urls_commands'
import { SELECTORS as s } from '../../support/generic_selector_commands'

context('Open a file', function () {
  let workspaceId
  let contentId
  const filename = 'the_pdf.pdf'
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.fixture('baseWorkspace').then(workspace => {
      cy.createFile(filename, 'file', filename, workspace.workspace_id).then(file => {
        contentId = file.content_id
      })
    })
    cy.visit('/')
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({ pageName: p.CONTENT_OPEN, params: { contentId: contentId } })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('File app', () => {
    it('should have an action button with a menu', () => {
      cy.get('[data-cy=dropdownContentButton]').click()
      cy.get('[data-cy=popinListItem__downloadFile]')
        .should('have.attr', 'href')
        .should('include', filename)
      cy.get('[data-cy=popinListItem__downloadAsPdf]')
        .should('have.attr', 'href')
        .should('include', filename)
      cy.get('[data-cy=popinListItem__downloadPageAsPdf]')
        .should('have.attr', 'href')
        .should('include', filename)
    })
  })
})
