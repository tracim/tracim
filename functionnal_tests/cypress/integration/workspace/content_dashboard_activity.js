import { PAGES as p } from '../../support/urls_commands.js'

describe('recentactivity in dashboard page', function () {
  const threadTitle = 'Thread title'
  var workspaceId = 0

  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.visitPage({
        pageName: p.DASHBOARD,
        params: { workspaceId }
      })
    })
  })

  it('recentactivity should be visible', function () {
    cy.get('.recentactivity').scrollIntoView()
    cy.get('.recentactivity .recentactivity__header__title').should('be.visible')
    cy.get('.recentactivity .recentactivity__header__allread').should('be.visible')
  })

  describe('With no recent activity', function () {
    it('should show the label .recentactivity__empty', function () {
      cy.get('.recentactivity .recentactivity__list').should('be.visible')
    })
  })

  describe('With one recent activity', function () {
    it('should show the activity and a button to see more', function () {
      cy.get('.dashboard__workspaceInfo').scrollIntoView()
      cy.get('.recentactivity .recentactivity__list .recentactivity__empty').should('be.visible')
      cy.createThread(threadTitle, workspaceId)
      cy.get('.recentactivity .recentactivity__list button.recentactivity__more__btn').should('be.visible')
    })
  })

})
