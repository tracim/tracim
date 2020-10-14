import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

describe('Login page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.visitPage({ pageName: p.LOGIN, params: { loginParam: '' } })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  it('should renders every components', function () {
    cy.url().should('include', '/login')

    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
      .find('.card-header.loginpage__card__header')
      .should('be.visible')

    cy.getTag({ selectorName: s.HEADER })
      .find('.dropdownMenu__image')
      .should('be.visible')

    cy.get('.loginpage__footer__text')
      .should('be.visible')

    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
      .find('input[type=text]')
      .should('be.visible')

    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
      .find('input[type=text]')
      .should('have.attr', 'placeholder')

    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
      .find('input[type=password]')
      .should('be.visible')

    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
      .find('input[type=password]')
      .should('have.attr', 'placeholder')

    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
      .find('.loginpage__card__form__btnsubmit')
      .should('be.visible')

    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
      .find('.loginpage__card__form__btnsubmit')
      .should('have.attr', 'type', 'submit')

    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
      .find('.loginpage__card__form__pwforgot')
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
