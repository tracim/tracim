import { PAGES } from '../../support/urls_commands'

describe('App Workspace Advanced', function () {
  let workspaceId
  let workspaceLabel

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      workspaceLabel = workspace.label
    })
  })

  beforeEach(() => {
    cy.loginAs('administrators')
  })

  it('should open direct from url', () => {
    cy.visitPage({ pageName: PAGES.ADVANCED_DASHBOARD, params: { workspaceId } })
    cy.contains('.workspace_advanced__defaultRole .formBlock__title', 'Default role:')
      .should('be.visible')
  })

  describe('from dashboard', () => {
    beforeEach(() => {
      cy.visitPage({ pageName: PAGES.DASHBOARD, params: { workspaceId } })
      cy.contains('.pageTitleGeneric__title__label', workspaceLabel)
      cy.get('.dashboard__workspace__detail__buttons .iconbutton').click()
    })

    it('should open when clicking on the button', () => {
      cy.contains('.workspace_advanced__defaultRole .formBlock__title', 'Default role:')
        .should('be.visible')
    })

    it('should redirect to dashboard when closing', () => {
      cy.get('.workspace_advanced__contentpage__header [data-cy=popinFixed__header__button__close]').click()
      cy.contains('.pageTitleGeneric__title__label', workspaceLabel)
    })
  })

  describe('from administrator space list', () => {
    beforeEach(() => {
      cy.visitPage({ pageName: PAGES.ADMIN_WORKSPACE })
      cy.contains('.pageTitleGeneric__title__label', 'Space management')
      cy.contains('.adminWorkspace__workspaceTable__tr__td-link', workspaceLabel).click()
    })

    it('should open when clicking on the space name', () => {
      cy.contains('.workspace_advanced__defaultRole .formBlock__title', 'Default role:')
        .should('be.visible')
    })

    it('should redirect to adiministrator page when closing', () => {
      cy.get('.workspace_advanced__contentpage__header [data-cy=popinFixed__header__button__close]').click()
      cy.contains('.pageTitleGeneric__title__label', 'Space management')
    })
  })
})
