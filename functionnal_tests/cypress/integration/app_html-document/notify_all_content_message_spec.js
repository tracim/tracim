import { PAGES as p } from '../../support/urls_commands'

const htmlDocTitle = 'HtmlDocTitle'
const HtmlDocContent = 'HtmlDocContent'

let workspaceId, contentId

describe('In Html Document', () => {
  describe('if the user makes a change', () => {
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
      cy.visitPage({ pageName: p.CONTENT_OPEN, params: { contentId } })
    })

    afterEach(function () {
      cy.cancelXHR()
    })

    describe('clicking at "notify all" message', () => {
      it.skip('should send a comment with a @all mention', () => {
        // FIXME - RJ - 2022-02-16 - disabled test (see #5436)
        cy.waitForTinyMCELoaded()
          .then(() => cy.typeInTinyMCE(HtmlDocContent))
          .then(() => {
            cy.get('[data-cy=editionmode__button__submit]').should('not.be.disabled').click()
            cy.assertTinyMCEContent(HtmlDocContent)
            cy.get('.promptMessage').should('be.visible')
            cy.get('.buttonLink').click()
            cy.contains('.mention', '@all').should('be.visible')
          })
      })
    })
  })
})
