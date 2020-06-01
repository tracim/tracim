import { PAGES } from '../../support/urls_commands.js'

describe('App Folder Advanced', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.visit(`/ui/workspaces/${workspace.workspace_id}/contents?type=html-document`)
    })
  })

  it('should have translations', () => {
    cy.get('.workspace__header__title').contains('List of text documents')

    cy.changeLanguage('fr')
    cy.get('.workspace__header__title').contains('Liste des documents texte')

    cy.changeLanguage('pt')
    cy.get('.workspace__header__title').contains('Lista de documentos de texto')
  })
})
