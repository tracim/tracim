import { PAGES } from '../../support/urls_commands.js'

describe('App Folder Advanced', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.visitPage({ pageName: PAGES.CONTENTS, params: { workspaceId: workspace.workspace_id } })
    })
  })

  it('should have translations', () => {
    cy.get('.workspace__header__title').contains('List of contents')

    cy.changeLanguage('fr')
    cy.get('.workspace__header__title').contains('Liste des contenus')

    cy.changeLanguage('pt')
    cy.get('.workspace__header__title').contains('Lista de conteúdos')
  })
})
