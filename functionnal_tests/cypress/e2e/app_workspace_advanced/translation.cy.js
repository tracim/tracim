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
    cy.changeLanguageFromApiForAdminUser('en')
    cy.visitPage({ pageName: PAGES.ADVANCED_DASHBOARD, params: { workspaceId } })
    cy.contains('.workspace_advanced__defaultRole .formBlock__title', 'Default role:')

    cy.changeLanguageFromApiForAdminUser('fr')
    cy.visitPage({ pageName: PAGES.ADVANCED_DASHBOARD, params: { workspaceId } })
    cy.contains('.workspace_advanced__defaultRole .formBlock__title', 'Rôle par défaut :')

    cy.changeLanguageFromApiForAdminUser('pt')
    cy.visitPage({ pageName: PAGES.ADVANCED_DASHBOARD, params: { workspaceId } })
    cy.contains('.workspace_advanced__defaultRole .formBlock__title', 'Função predefinida:')

    cy.changeLanguageFromApiForAdminUser('de')
    cy.visitPage({ pageName: PAGES.ADVANCED_DASHBOARD, params: { workspaceId } })
    cy.contains('.workspace_advanced__defaultRole .formBlock__title', 'Standard-Rolle:')

    cy.changeLanguageFromApiForAdminUser('ar')
    cy.visitPage({ pageName: PAGES.ADVANCED_DASHBOARD, params: { workspaceId } })
    cy.contains('.workspace_advanced__defaultRole .formBlock__title', 'الدور الإفتراضي:')

    cy.changeLanguageFromApiForAdminUser('es')
    cy.visitPage({ pageName: PAGES.ADVANCED_DASHBOARD, params: { workspaceId } })
    cy.contains('.workspace_advanced__defaultRole .formBlock__title', 'Rol por defecto:')
  })
})
