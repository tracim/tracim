import { login } from '../helpers/index.js'

describe('navigate :: create_new > workspace', function () {
    before(function () {
        login(cy)
    })
    after(function() {
        cy.get('#dropdownMenuButton').click()
        cy.get('div.setting__link').click()
        cy.url().should('include', '/login')
    })
    it ('', function () {
        cy.url().should('include', '/workspaces/1/dashboard')
        cy.get('button.sidebar__content__btnnewworkspace__btn.btn').click()
        cy.get('.createcontent__contentname__title').should('be.visible')
        cy.get('.createcontent__form__input').should('have.attr', 'placeholder')
        cy.get('.createcontent__form__input').type('workspace1')
        cy.get('.createcontent__form__input').should('have.attr', 'value', 'workspace1')
        cy.get('.cardPopup__close').click()
        cy.get('.createcontent__contentname__title').should('not.be.visible')
    })
})
