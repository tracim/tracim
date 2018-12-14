describe('navigate :: workspace > create_new > html-document', function () {
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
    cy.get('.dashboard__calltoaction .fa-file-text-o').should('be.visible')
  })
})
