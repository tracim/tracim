import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

describe('Login page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  it('should allow login and logout', function () {
    cy.visitPage({ pageName: p.LOGIN, params: { loginParam: '' } })

    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
      .find('input[type=text]')
      .should('be.visible')

    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
      .find('input[type=text]')
      .type('admin@admin.admin')

    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
      .find('input[type=password]')
      .should('be.visible')

    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
      .find('input[type=password]')
      .type('admin@admin.admin')

    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
      .find('.loginpage__card__form__btnsubmit')
      .should('be.visible')

    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
      .find('.loginpage__card__form__btnsubmit')
      .click()

    cy.get('.menuprofil__dropdown__name.btn')
      .click()

    cy.getTag({ selectorName: s.HEADER })
      .find('div.menuprofil__dropdown__setting__link .fa-sign-out')
      .click()
  })
})
