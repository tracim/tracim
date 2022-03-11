import { PAGES as p } from '../../support/urls_commands'

describe('Dashboard button list', () => {
  let workspaceId
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId } })
    })
  })

  it('should have translations', () => {
    cy.get('button[title="Start a topic"]').contains('Start a topic')

    cy.changeLanguage('fr')
    cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId } })
    cy.get('button[title="Lancer une discussion"]').contains('Lancer une discussion')

    cy.changeLanguage('pt')
    cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId } })
    cy.get('button[title="Começar uma discussão"]').contains('Começar uma discussão')

    cy.changeLanguage('de')
    cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId } })
    cy.get('button[title="Diskussion beginnen"]').contains('Diskussion beginnen')
  })
})
