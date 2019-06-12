import { login, logout } from '../helpers/index.js'

describe('Login page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.visit('/ui/login')
  })
  it('should renders every components', function () {
    cy.url().should('include', '/login')
    cy.get('.card-header.loginpage__card__header').should('be.visible')
    cy.get('.dropdownlang__dropdown__btnlanguage__imgselected').should('be.visible')
    cy.get('.loginpage__footer__text').should('be.visible')
    cy.get('input[type=email]').should('be.visible')
    cy.get('input[type=email]').should('have.attr', 'placeholder')
    cy.get('input[type=password]').should('be.visible')
    cy.get('input[type=password]').should('have.attr', 'placeholder')
    cy.get('.loginpage__card__form__btnsubmit').should('be.visible')
    cy.get('.loginpage__card__form__btnsubmit').should('have.attr', 'type', 'button')
    cy.get('.loginpage__card__form__pwforgot').should('be.visible')
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
