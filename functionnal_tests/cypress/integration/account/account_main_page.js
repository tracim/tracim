describe('Account page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit('/')
  })
  it("should be able it access it through header's button", function () {
    cy.get('[data-cy=menuprofil__dropdown__button]').click()
    cy.get('[data-cy=menuprofil__dropdown__account__link]').click()
    cy.get('.userinfo')
  })
})
