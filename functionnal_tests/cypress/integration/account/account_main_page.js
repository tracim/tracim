describe('Account page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit('/')
  })
  it("should be able it access it through header's button", () => {
    cy.get('[data-cy=menuprofil__dropdown__button]').click()
    cy.get('[data-cy=menuprofil__dropdown__account__link]').click()
    cy.get('.userinfo')
  })

  it("Avatar should not be empty", () => {
    cy.get('[data-cy=menuprofil__dropdown__button]').click()
    cy.get('[data-cy=menuprofil__dropdown__account__link]').click()
    cy.get('[data-cy=personaldata__form__txtinput__fullname]').type("      User FromOuterSpace    ")
    cy.get('.personaldata__form__button').click()
    cy.get('.avatar').contains("UF")
  })
})
