import { login } from '../helpers/index.js'

describe('content :: home_page', function () {
    before(function () {
        login(cy)
    })
    after(function() {
        cy.get('#dropdownMenuButton').click()
        cy.get('div.setting__link').click()
        cy.url().should('include', '/login')
    })
    it ('', function () {
        cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label').click()
        cy.get('.show .subdropdown__link__thread__icon').click()
        cy.get('.createcontent__contentname').should('be.visible')
        cy.get('.createcontent__form__input').should('have.attr', 'placeholder')
        cy.get('.createcontent__form__input').type('thread1')
        cy.get('.createcontent__form__input').should('have.attr', 'value', 'thread1')
        cy.get('.cardPopup__close').click()
        cy.get('.createcontent__contentname').should('not.be.visible')
    })
})
