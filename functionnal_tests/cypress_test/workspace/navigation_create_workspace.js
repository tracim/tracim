import { login, logout } from '../helpers/index.js'

describe('navigate :: create_new > workspace', function () {
    before(function () {
        login (cy)
    })
    after(function() {
        logout (cy)
    })
    it ('', function () {
        cy.visit('/workspaces/1/dashboard')
        cy.url().should('include', '/workspaces/1/dashboard')
        cy.get('button.sidebar__content__btnnewworkspace__btn.btn').should('be.visible')
        cy.get('button.sidebar__content__btnnewworkspace__btn.btn').click()
        cy.get('.cardPopup__container .createcontent__contentname__title').should('be.visible')
        cy.get('.cardPopup__container .createcontent__form__input').should('have.attr', 'placeholder')
        cy.get('.cardPopup__container .createcontent__form__input').type('workspace1')
        cy.get('.cardPopup__container .createcontent__form__input').should('have.attr', 'value', 'workspace1')
        cy.get('.cardPopup__container .cardPopup__close').click()
        cy.get('.cardPopup__container .createcontent__contentname__title').should('not.be.visible')
    })
})
