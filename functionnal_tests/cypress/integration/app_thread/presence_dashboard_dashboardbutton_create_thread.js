describe('navigate :: workspace > create_new > thread', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit('/ui/workspaces/1/dashboard')
  })
  it('dashboard > button', function () {
    cy.get('.pageWrapperGeneric .dashboard__workspace__detail').should('be.visible')
    cy.get('.dashboard__calltoaction .fa-comments-o').should('be.visible')
  })
})
