describe('navigation :: admin > workspace', function () {
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
    cy.get('a[href="/ui/admin/workspace"]').click()
    cy.url().should('include', '/ui/admin/workspace')
    cy.get('.adminWorkspace__description').should('be.visible')
  })
})
