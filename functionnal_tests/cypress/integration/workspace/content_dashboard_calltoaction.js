import { PAGES } from '../../support/urls_commands'

let workspaceId

describe('content :: workspace > dashboard', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
    })
  })

  beforeEach(() => {
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.DASHBOARD, params: { workspaceId: workspaceId } })
  })

  it('dashboard__workspace > calltoaction', function () {
    cy.get('.dashboard__calltoaction').should('be.visible')
    cy.get('.dashboard__calltoaction > div:nth-child(1)').should('be.visible')
    cy.get('.dashboard__calltoaction > div:nth-child(1) .dashboard__calltoaction__button__text__icon').should('be.visible')
    cy.get('.dashboard__calltoaction > div:nth-child(1) .dashboard__calltoaction__button__text__title').should('be.visible')
    cy.get('.dashboard__calltoaction > div:nth-child(2)').should('be.visible')
    cy.get('.dashboard__calltoaction > div:nth-child(2) .dashboard__calltoaction__button__text__icon').should('be.visible')
    cy.get('.dashboard__calltoaction > div:nth-child(2) .dashboard__calltoaction__button__text__title').should('be.visible')
    cy.get('.dashboard__calltoaction > div:nth-child(3)').should('be.visible')
    cy.get('.dashboard__calltoaction > div:nth-child(3) .dashboard__calltoaction__button__text__icon').should('be.visible')
    cy.get('.dashboard__calltoaction > div:nth-child(3) .dashboard__calltoaction__button__text__title').should('be.visible')
    cy.get('.dashboard__calltoaction__button i.fa-comments-o').should('be.visible')
    cy.get('.dashboard__calltoaction__button i.fa-paperclip').should('be.visible')
    cy.get('.dashboard__calltoaction__button i.fa-file-text-o').should('be.visible')
  })
})
