import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

describe('Login page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.visitPage({ pageName: p.LOGIN, params: { loginParam: '' }, waitForTlm: false })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  it('should render every component', function () {
    cy.url().should('include', '/login')

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .should('be.visible')

    cy.getTag({ selectorName: s.HEADER })
      .find('.dropdownMenuButton')
      .should('be.visible')

    cy.get('.loginpage__main__footer__text')
      .should('be.visible')

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('input[type=text]')
      .should('be.visible')

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('input[type=text]')
      .should('have.attr', 'placeholder')

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('input[type=password]')
      .should('be.visible')

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('input[type=password]')
      .should('have.attr', 'placeholder')

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('.loginpage__main__form__btnsubmit')
      .should('be.visible')

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('.loginpage__main__form__btnsubmit')
      .should('have.attr', 'type', 'submit')

    cy.getTag({ selectorName: s.LOGIN_PAGE_MAIN })
      .find('.loginpage__main__form__forgot_password')
      .should('be.visible')
  })

  it('should not display connection error message', () => {
    cy.wait(5000)
    cy.get('connection_error')
    .should('not.exist')
  })
})
// @philippe 08/08/2018 - Not implemented in Tracim_V2.0
//
// describe('Content :: homepage > login > search', function () {
//    before(function () {
//        cy.visit('/')
//    })
//    it('check all content', function () {
//        cy.get('.search__input.form-control').should('be.visible')
//        cy.get('.search__input.form-control').should('have.attr','placeholder')
//        cy.get('#headerInputSearch').should('be.visible')
//    })
// })
