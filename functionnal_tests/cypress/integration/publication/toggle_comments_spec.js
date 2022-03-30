import { PAGES } from '../../support/urls_commands'

const publishButton = '.commentArea__submit__btn'
const text = 'Hello, world'

describe('Publications page', () => {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then((workspace) => {
      cy.changeLanguage('fr')
      cy.visitPage({
        pageName: PAGES.PUBLICATION,
        params: { workspaceId: workspace.workspace_id },
        waitForTlm: true
      })
    })
  })

  it("should change button's label according to its state", () => {
    cy.get('#wysiwygTimelineCommentPublication').type(text)
    cy.contains(publishButton, 'Publier').click()
    cy.contains('.buttonComments', 'Commenter').should('be.visible').click()
    cy.get('#wysiwygTimelineComment1').type(text)
    cy.contains('.feedItem__timeline__texteditor__submit__btn', 'Envoyer').should('be.visible').click()
    cy.contains('.buttonComments', 'Masquer la discussion').should('be.visible').click()
    cy.contains('.buttonComments', 'Afficher la discussion (1)').should('be.visible').click()
  })
})
