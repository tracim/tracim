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
    for (var i = 1; i <= 6; i++) {
      cy.get(`.dashboard__workspace__rightMenu__contents button:nth-child(${i})[title]`).should('be.visible')
      cy.get(`.dashboard__workspace__rightMenu__contents button:nth-child(${i}) .iconbutton__text_with_icon`).should('be.visible')
      cy.get(`.dashboard__workspace__rightMenu__contents button:nth-child(${i}) .iconbutton__icon`).should('be.visible')
    }
    cy.get('.dashboard__workspace__rightMenu__contents button .iconbutton__icon.far.fa-comments').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents button .iconbutton__icon.fas.fa-paperclip').should('be.visible')
    cy.get('.dashboard__workspace__rightMenu__contents button .iconbutton__icon.far.fa-file-alt').should('be.visible')
  })
})
