import { PAGES } from '../../support/urls_commands'

describe('App Workspace Advanced', function () {
  let workspaceId
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.visitPage({ pageName: PAGES.ADVANCED_DASHBOARD, params: { workspaceId } })
    })
  })

  it('should have translations', () => {
    cy.changeLanguage('en')
    cy.visitPage({ pageName: PAGES.ADVANCED_DASHBOARD, params: { workspaceId } })
    cy.contains('.workspace_advanced__defaultRole .formBlock__title', 'Default role:')

    cy.changeLanguage('fr')
    cy.visitPage({ pageName: PAGES.ADVANCED_DASHBOARD, params: { workspaceId } })
    cy.contains('.workspace_advanced__defaultRole .formBlock__title', 'Rôle par défaut :')

    cy.changeLanguage('pt')
    cy.visitPage({ pageName: PAGES.ADVANCED_DASHBOARD, params: { workspaceId } })
    cy.contains('.workspace_advanced__defaultRole .formBlock__title', 'Função predefinida:')

    cy.changeLanguage('de')
    cy.visitPage({ pageName: PAGES.ADVANCED_DASHBOARD, params: { workspaceId } })
    cy.contains('.workspace_advanced__defaultRole .formBlock__title', 'Standard-Rolle:')
  })
})
