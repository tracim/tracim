describe('navigate :: workspace > create_new > custom-form', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
  })
  it('test all button', function () {
    cy.visit('/ui/workspaces/1/dashboard')
    cy.get('.pageWrapperGeneric .dashboard__workspace__detail').should('be.visible')
    cy.get('.dashboard__calltoaction .fa-users').should('be.visible')
  })
})
