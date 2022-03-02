import { PAGES } from '../../support/urls_commands'

describe('navigate :: workspace > create_new > thread', function () {
  let threadId
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.createThread('thread', workspace.workspace_id).then(thread => {
        threadId = thread.content_id
        cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: threadId } })
      })
    })
  })

  it('should have translations', () => {
    cy.get('.thread__contentpage__texteditor__submit__btn').contains('Send')

    cy.changeLanguage('fr')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: threadId } })
    cy.get('.thread__contentpage__texteditor__submit__btn').contains('Envoyer')

    cy.changeLanguage('pt')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: threadId } })
    cy.get('.thread__contentpage__texteditor__submit__btn').contains('Enviar')

    cy.changeLanguage('de')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: threadId } })
    cy.get('.thread__contentpage__texteditor__submit__btn').contains('Senden')
  })
})
