import { PAGES } from '../../support/urls_commands.js'
import { SELECTORS as s } from '../../support/generic_selector_commands.js'

describe('Account page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
  })

  it("should be able it access it through header's buttons", () => {
    cy.getTag({ selectorName: s.HEADER })
      .find('[data-cy=menuprofil__dropdown__button]')
      .click()

    cy.get('[data-cy=menuprofil__dropdown__account__link]')
      .click()

    cy.get('.userinfo')
  })
})
