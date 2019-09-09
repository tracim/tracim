describe('content :: workspace > dashbord', function () {
  const threadTitle = 'Thread title'

  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.createThread(threadTitle, workspace.workspace_id)
      cy.visit(`/ui/workspaces/${workspace.workspace_id}/dashboard`)
    })
  })

  it('dashboard__workspaceInfo > recentactivity', function () {
    cy.get('.recentactivity').scrollIntoView()
    cy.get('.recentactivity .recentactivity__header__title').should('be.visible')
    cy.get('.recentactivity .recentactivity__header__allread').should('be.visible')
    cy.get('.recentactivity .recentactivity__list').should('be.visible')
    cy.get('.recentactivity .recentactivity__list .recentactivity__empty').should('be.visible')
    cy.get('.recentactivity .recentactivity__list button.recentactivity__more__btn').should('be.visible')
  })
})
