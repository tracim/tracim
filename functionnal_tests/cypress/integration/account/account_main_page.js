describe('account :: main_page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.login('users')
    cy.visit('/')
  })
  it('', function () {
    cy.get('#dropdownMenuButton')
    cy.get('#dropdownMenuButton').click()
    cy.get('a.setting__link[href="/account"]')
    cy.get('a.setting__link[href="/account"]').click()
    cy.url().should('include', '/account')
    cy.get('.userinfo')
  })
})
