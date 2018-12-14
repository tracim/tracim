describe('content :: workspace > dashbord', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.create_thread()
    cy.visit('/ui/workspaces/1/dashboard')
  })

  it('dashboard__workspaceInfo > recentactivity', function () {
    cy.get('.recentactivity .recentactivity__header__title').should('be.visible')
    cy.get('.recentactivity .recentactivity__header__allread').should('be.visible')
    cy.get('.recentactivity .recentactivity__list').should('be.visible')
    cy.get('.recentactivity .recentactivity__list .recentactivity__empty').should('be.visible')
    cy.get('.recentactivity .recentactivity__list button.recentactivity__more__btn').should('be.visible')
  })
})
