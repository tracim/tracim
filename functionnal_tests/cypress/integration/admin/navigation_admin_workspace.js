describe('navigation :: admin > workspace', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.login('administrators')
    cy.visit('/')
  })
  it('', function () {
    cy.get('.adminlink.dropdown').should('be.visible').click()
    cy.get('a[href="/admin/workspace"]').click()
    cy.url().should('include', '/admin/workspace')
    cy.get('.adminWorkspace__description').should('be.visible')
  })
})
