describe('content :: workspace > dashboard', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visit('/ui/workspaces/1/dashboard')
  })
  it('dashboard__workspace > userstatus', function () {
    cy.get('.dashboard__workspace .userstatus').should('be.visible')
    cy.get('.userstatus .userstatus__username').should('be.visible')
    cy.get('.userstatus .userstatus__role').should('be.visible')
    cy.get('.userstatus .userstatus__notification').should('not.exist')
    cy.get('.userstatus .userstatus__notification__icon').should('not.exist')
    cy.get('.userstatus .userstatus__notification__icon .fa-envelope-open').should('not.exist')
    cy.get('.userstatus .userstatus__notification__text').should('not.exist')
  })
})
