describe('navigate :: workspace > create_new > custom-form', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  it('test all button', function () {
    // TODO Custom_form tests are skipped for now, tests must be enabled when the app will be activated
    // see: https://github.com/tracim/tracim/issues/2895
    this.skip()
    cy.loginAs('users')
    cy.visit('/ui/workspaces/1/dashboard')
    cy.get('.pageWrapperGeneric .dashboard__workspace__detail').should('be.visible')
    cy.get('.dashboard__calltoaction .fa-users').should('be.visible')
  })
})
