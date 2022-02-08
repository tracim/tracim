import { PAGES } from '../../support/urls_commands'

describe('navigate :: workspace > create_new > thread', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.visitPage({
        pageName: PAGES.CONTENTS,
        getters: { type: 'thread' },
        params: { workspaceId: workspace.workspace_id }
      })
    })
    cy.get('[data-cy="dropdownCreateBtn"]').click()
    cy.get('.show .fa-comments').should('be.visible').click()
    cy.get('[data-cy="createcontent__form__input"]').type('test')
    cy.get('[data-cy="popup__createcontent__form__button"]').click()
  })

  it('should have translations', () => {
    cy.get('.thread__contentpage__texteditor__submit__btn').contains('Send')

    cy.changeLanguage('fr')
    cy.get('.thread__contentpage__texteditor__submit__btn').contains('Envoyer')

    cy.changeLanguage('pt')
    cy.get('.thread__contentpage__texteditor__submit__btn').contains('Enviar')

    cy.changeLanguage('de')
    cy.get('.thread__contentpage__texteditor__submit__btn').contains('Senden')
  })
})
