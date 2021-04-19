import { PAGES as p } from '../../support/urls_commands'

describe('Dashboard button list', () => {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId: workspace.workspace_id } })
    })
  })

  it('should have translations', () => {
    cy.get('button[title="Start a topic"]').contains('Start a topic')

    cy.changeLanguage('fr')
    cy.get('button[title="Lancer une discussion"]').contains('Lancer une discussion')

    cy.changeLanguage('pt')
    cy.get('button[title="Começar uma discussão').contains('Começar uma discussão')
  })
})
