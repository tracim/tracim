import { login, logout } from '../helpers/index.js'

describe('navigate :: workspace > create_new > html-document', function () {
    before(function () {
        login(cy)
    })
    after(function() {
        logout (cy)
    })
    it ('allcontent > button', function() {
        cy.visit('/workspaces/1/contents')
        cy.get('.pageTitleGeneric__title__icon').should('be.visible')
        cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label').should('be.visible')
        cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label').click()
        cy.get('.show .subdropdown__link__html-document__icon').should('be.visible')
        cy.get('.show .subdropdown__link__html-document__icon').click()
        var titre1='document1'
        cy.get('.cardPopup__container').should('be.visible')
        cy.get('.cardPopup__container .cardPopup__header').should('be.visible')
        cy.get('.cardPopup__container .cardPopup__close').should('be.visible')
        cy.get('.cardPopup__container .cardPopup__body').should('be.visible')
        cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'placeholder')
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(titre1)
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
        cy.get('.cardPopup__container .cardPopup__close').click()
        cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('not.be.visible')
    })
})
