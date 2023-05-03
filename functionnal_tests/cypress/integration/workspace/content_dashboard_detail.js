import { PAGES } from '../../support/urls_commands'

let workspaceId
let workspaceLabel

describe('Dashboard', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      workspaceLabel = workspace.label
    })
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visitPage({ pageName: PAGES.DASHBOARD, params: { workspaceId: workspaceId } })
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it('should have navigation menus', function () {
    cy.get('.dashboard.pageWrapperGeneric').should('be.visible')
    cy.get('.pageTitleGeneric').should('be.visible')
    cy.get('.tabBar').should('be.visible')
    cy.get('.dashboard .pageContentGeneric').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu').should('be.visible')
  })

  it('show display title', function () {
    cy.contains('.pageTitleGeneric', workspaceLabel).should('be.visible')
  })

  it('should display description and settings', function () {
    cy.get('.pageContentGeneric .dashboard__workspace__detail__description').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents .fa-cog').should('be.visible')
  })
})
