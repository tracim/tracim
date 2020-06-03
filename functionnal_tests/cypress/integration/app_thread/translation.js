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
  })

  it('should have translations', () => {
    cy.get('.workspace__header__title').contains('List of threads')

    cy.changeLanguage('fr')
    cy.get('.workspace__header__title').contains('Liste des discussions')

    cy.changeLanguage('pt')
    cy.get('.workspace__header__title').contains('Lista de discussões')
  })
})
