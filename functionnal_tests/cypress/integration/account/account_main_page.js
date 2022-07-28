import { PAGES } from '../../support/urls_commands.js'

describe('Account page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
  })

  it("should be able to access the account page through header's buttons", () => {
    cy.get('[data-cy=menuprofile__sidebar]')
      .click()

    cy.get('[data-cy=menuprofile__dropdown__account__link]')
      .click()

    cy.get('.userinfo')
  })
})
