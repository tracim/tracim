describe('navigation :: admin > user', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visit('/ui')
  })
  it('', function () {
    cy.get('.sidebar__item__menu').click()
    cy.get('[href="/ui/admin/user"]').should('be.visible').click()
    cy.url().should('include', '/admin/user')
    cy.get('.adminUser__description').should('be.visible')
  })
})
