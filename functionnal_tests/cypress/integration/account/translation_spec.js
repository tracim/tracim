import { PAGES } from '../../support/urls_commands.js'
import { SELECTORS as s } from '../../support/generic_selector_commands.js'

const myAccountEn = 'My Account'
const myAccountFr = 'Mon compte'
const myAccountPt = 'Minha conta'

const langButton = '.dropdownlang__dropdown'

describe('Account page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
    cy.getTag({ selectorName: s.HEADER })
      .find('[data-cy=menuprofil__dropdown__button]')
      .click()
    cy.get('[data-cy=menuprofil__dropdown__account__link]')
      .click()
  })

  it("should have english translation", () => {
    cy.get('.account__title').should('have', myAccountEn)
  })

  // it("should have english translation", () => {
    // cy.get(langButton).click()
  //   cy.get('[data-cy=menuprofil__dropdown__account__link]')
  //     .click()

  //   cy.get('.userinfo')
  // })

  // it("should have english translation", () => {
  //   cy.get('[data-cy=menuprofil__dropdown__account__link]')
  //     .click()

  //   cy.get('.userinfo')
  // })
})
