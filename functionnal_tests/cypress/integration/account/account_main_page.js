describe('account :: main_page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit('/')
  })
  it('', function () {
    cy.get('#dropdownMenuButton').click()
    cy.get('a.setting__link[href="/ui/account"]').click()
    cy.get('.userinfo')
  })
})
