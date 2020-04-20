describe('navigate :: workspace > create_new > custom-form', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  it('test all button', function () {
    this.skip() // INFO - GM - 2020/04/20 - Skip custom_form tests for now
    cy.loginAs('users')
    cy.visit('/ui/workspaces/1/dashboard')
    cy.get('.pageWrapperGeneric .dashboard__workspace__detail').should('be.visible')
    cy.get('.dashboard__calltoaction .fa-users').should('be.visible')
  })
})
