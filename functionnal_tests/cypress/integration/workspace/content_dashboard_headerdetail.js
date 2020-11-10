import { PAGES } from '../../support/urls_commands'

let workspaceId
let workspaceLabel

describe('content :: workspace > dashbord', function () {
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

  it('part of dashboard', function () {
    cy.get('.dashboard.pageWrapperGeneric').should('be.visible')
    cy.get('.pageTitleGeneric').should('be.visible')
    cy.get('.tabBar').should('be.visible')
    cy.get('.dashboard .pageContentGeneric').should('be.visible')
  })

  it('dashboard__header__title', function () {
    cy.contains('.pageTitleGeneric', workspaceLabel).should('be.visible')
  })

  it('dashboard__workspace > dashboard__workspace__detail', function () {
    cy.get('.pageContentGeneric .dashboard__workspace__detail__title').should('be.visible')
    cy.get('.pageContentGeneric .dashboard__workspace__detail__description').should('be.visible')
    cy.get('.dashboard__workspace__detail__advancedmode').should('be.visible')
    cy.get('.dashboard__workspace__detail__advancedmode__button').should('have.attr', 'type', 'button').should('be.visible')
  })
})
