describe('content :: home_page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit('/ui')
    cy.get('.sidebar__content__navigation__workspace__item__number').click()
  })
  it('', function () {
    cy.get('.sidebar__content .fa-chevron-up').should('be.visible')
    cy.get('li').contains('Dashboard').should('have.attr', 'href', '/ui/workspaces/1/dashboard')
    cy.get('.fa-signal').should('be.visible')
    cy.get('.fa-signal').click()
    cy.url().should('include', '/workspaces/1/dashboard')
    cy.get('.dashboard__header.pageTitleGeneric').should('be.visible')
  })
})
