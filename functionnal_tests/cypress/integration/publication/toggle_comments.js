import { PAGES } from '../../support/urls_commands'

const publishButton = '.publications__publishArea__buttons__submit'
const text = 'Hello, world'

describe('Publications page', () => {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then((workspace) => {
      cy.visitPage({
        pageName: PAGES.PUBLICATION,
        params: { workspaceId: workspace.workspace_id },
        waitForTlm: true
      })
    })
  })

  it('should have translations', () => {
    cy.get('#wysiwygTimelineCommentPublication').type(text)
    cy.contains(publishButton, 'Publish').click()

    cy.contains('.buttonComments', 'Commenter').should('be.visible').click()

    cy.contains('.buttonComments', 'Masquer').should('be.visible')
    cy.contains('.buttonComments', 'Masquer').click()
  })
})
