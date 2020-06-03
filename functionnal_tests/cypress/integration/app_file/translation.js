import { PAGES } from '../../support/urls_commands.js'

describe('App File', () => {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.visitPage({ pageName: PAGES.CONTENTS, getters: { type: 'file' }, params: { workspaceId: workspace.workspace_id } })
    })
  })

  it('should have translations', () => {
    cy.get('.folder__header__name').contains('Received files')

    cy.changeLanguage('fr')
    cy.get('.folder__header__name').contains('Fichiers reçus')

    cy.changeLanguage('pt')
    cy.get('.folder__header__name').contains('Ficheiros recebidos')
  })
})
