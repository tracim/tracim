import { PAGES as p } from '../../support/urls_commands'

let workspaceTest

describe('Dashboard', () => {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceTest = workspace
    })
  })

  beforeEach(() => {
    cy.loginAs('administrators')
    cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId: workspaceTest.workspace_id } })
    cy.contains('.pageTitleGeneric__title__label', workspaceTest.label)
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it('should show the description', () => {
    cy.contains('.dashboard__workspace__detail__description', workspaceTest.description)
  })

  it('should show the space settings button that opens space settings', () => {
    cy.get('button[title="Space settings"]')
      .should('be.visible')
      .click()
    cy.contains('.workspace_advanced__contentpage__header__title', workspaceTest.label)
  })

  it('should show recent activities', () => {
    cy.get('.workspaceRecentActivities').should('be.visible')
    cy.contains('.workspaceRecentActivities__header', 'Recent activities')
  })

  it('should show users role', () => {
    cy.contains('.userstatus__role', 'Your role')
    cy.contains('.userstatus__role__text', 'Space manager')

    cy.logout()
    cy.loginAs('users')
    cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId: workspaceTest.workspace_id } })

    cy.contains('.userstatus__role__text', 'Contributor')
  })
})
