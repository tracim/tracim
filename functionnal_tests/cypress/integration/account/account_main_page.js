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

  it("should be able to access the account page through sidebar's buttons", () => {
    cy.get('.sidebar__item__profile .sidebar__item__foldChildren').click()

    cy.get('[data-cy=sidebar__account__settings]')
      .click()

    cy.get('.userinfo')
  })
})
