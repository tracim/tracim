import { PAGES as p } from '../../support/urls_commands'

const htmlDocTitle = 'HtmlDocTitle'
const HtmlDocContent = 'HtmlDocContent'

let workspaceId, contentId

describe('In Html Document', () => {
  describe('if the user make a chaage', () => {
    before(function () {
      cy.resetDB()
      cy.setupBaseDB()
      cy.loginAs('administrators')
      cy.fixture('baseWorkspace').as('workspace').then(workspace => {
        workspaceId = workspace.workspace_id
        cy.createHtmlDocument(htmlDocTitle, workspaceId)
          .then(newContent => {
            contentId = newContent.content_id
          })
      })
    })

    beforeEach(function () {
      cy.loginAs('administrators')
      cy.visitPage({
        pageName: p.CONTENT_OPEN,
        params: { workspaceId: workspaceId, contentType: 'html-document', contentId: contentId }
      })
    })

    afterEach(function () {
      cy.cancelXHR()
    })

    describe('if click at "notify all" message', () => {
      it('should send a comment with a @all mention', () => {
        cy.waitForTinyMCELoaded()
          .then(() => cy.typeInTinyMCE(HtmlDocContent))
          .then(() => {
            cy.get('[data-cy=editionmode__button__submit]').should('not.be.disabled').click()
            cy.get('[data-cy=wsContentGeneric__option__menu__addversion]').should('not.be.disabled').click()
            cy.assertTinyMCEContent(HtmlDocContent)
            cy.get('.promptMessage').should('be.visible')
            cy.get('.buttonLink').click()
            cy.contains('.mention', '@all').should('be.visible')
          })
      })
    })
  })
})
