import { login, logout } from '../helpers/index.js'

describe('navigate :: workspace > create_new > thread', function () {
    before(function () {
        login(cy)
    })
    after(function() {
        logout (cy)
    })
    it ('dashboard > button', function() {
        cy.visit('/workspaces/1/dashboard')
        cy.get('.dashboard__workspace__detail').should('be.visible')
        cy.get('.dashboard__calltoaction .fa-comments-o').should('be.visible')
        cy.get('.dashboard__calltoaction .fa-comments-o').click()
        var titre1='thread1'
        cy.get('.cardPopup__container').should('be.visible')
        cy.get('.cardPopup__header').should('be.visible')
        cy.get('.cardPopup__close').should('be.visible')
        cy.get('.cardPopup__body').should('be.visible')
        cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'placeholder')
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(titre1)
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
        cy.get('.cardPopup__container .cardPopup__close').click()
        cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('not.be.visible')
    })
})
