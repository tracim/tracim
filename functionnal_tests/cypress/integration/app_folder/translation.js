import { PAGES } from '../../support/urls_commands.js'

describe('App Folder Advanced', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.visit(`/ui/workspaces/${workspace.workspace_id}/contents?type=file`)
    })
  })

  it("should have translations", () => {
    cy.get('.folder__header__name').contains('Received files')

    cy.changeLanguage('fr')
    cy.get('.folder__header__name').contains('Fichiers reçus')

    cy.changeLanguage('pt')
    cy.get('.folder__header__name').contains('Ficheiros recebidos')
  })
})
