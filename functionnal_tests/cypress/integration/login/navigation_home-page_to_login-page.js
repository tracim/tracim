import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'
import defaultAdmin from '../../fixtures/defaultAdmin.json'

describe('Login page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  it('should allow login with email and logout', function () {
    cy.visitPage({ pageName: p.LOGIN, params: { loginParam: '' }, waitForTlm: false })

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('input[type=email]')
      .should('be.visible')

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('input[type=email]')
      .type(defaultAdmin.email)

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('input[type=password]')
      .should('be.visible')

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('input[type=password]')
      .type(defaultAdmin.password)

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('.loginpage__main__form__btnsubmit')
      .should('be.visible')

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('.loginpage__main__form__btnsubmit')
      .click()

    cy.get('.sidebar__item__menu').first().should('be.visible').click()
    cy.get('[data-cy="sidebar__logout__item"]')
      .click()
  })

  it('should allow login with username and logout', function () {
    cy.visitPage({ pageName: p.LOGIN, params: { loginParam: '' }, waitForTlm: false })

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('input[type=email]')
      .should('be.visible')

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('input[type=email]')
      .type(defaultAdmin.username)

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('input[type=password]')
      .should('be.visible')

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('input[type=password]')
      .type(defaultAdmin.password)

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('.loginpage__main__form__btnsubmit')
      .should('be.visible')

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('.loginpage__main__form__btnsubmit')
      .click()

    cy.get('.sidebar__item__menu').first().should('be.visible').click()
    cy.get('[data-cy="sidebar__logout__item"]')
      .click()
  })
})
