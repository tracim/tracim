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
    cy.get('#dropdownMenuButton').click()
    cy.get('a.setting__link[href="/ui/account"]').click()
    cy.get('.userinfo')
  })
})
