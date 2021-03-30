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
    cy.get('.dashboard__workspace__rightMenu__contents').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents > div:nth-child(1)').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents > div:nth-child(1) .dashboard__workspace__rightMenu__contents__button__text__icon').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents > div:nth-child(1) .dashboard__workspace__rightMenu__contents__button__text__title').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents > div:nth-child(2)').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents > div:nth-child(2) .dashboard__workspace__rightMenu__contents__button__text__icon').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents > div:nth-child(2) .dashboard__workspace__rightMenu__contents__button__text__title').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents > div:nth-child(3)').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents > div:nth-child(3) .dashboard__workspace__rightMenu__contents__button__text__icon').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents > div:nth-child(3) .dashboard__workspace__rightMenu__contents__button__text__title').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents__button i.fa-comments').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents__button i.fa-paperclip').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents__button i.fa-file-alt').should('be.visible')
  })
})
