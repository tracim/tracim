import { login } from '../helpers/index.js'

describe('operation :: workspace > delete > thread', function () {
    before(function () {
        login(cy)
    })
    after(function() {
        cy.get('#dropdownMenuButton').click()
        cy.get('div.setting__link').click()
        cy.url().should('include', '/login')
    })
    it ('all content > thread > delete first thread', function(){
        var titre1='dashboard button thread'
        cy.get('.sidebar__content__navigation__workspace__item__submenu > li:nth-child(2)').click()
        cy.get('.pageTitleGeneric__title__icon').should('be.visible')
        cy.get('.content__name__text').contains(titre1).should('be.visible')
        cy.get('.content__name__text').contains(titre1).click()
        cy.get('.thread.visible').should('be.visible')
        cy.get('.thread.visible .wsContentGeneric__header__title').contains(titre1)
        cy.get('.thread.visible .align-items-center button:nth-child(2)').click()
        cy.get('.thread.visible .timeline__info__btnrestore').should('be.visible')
        cy.get('.thread.visible .thread__contentpage__header__close').click()
        cy.get('.thread.visible').should('not.be.visible')
    })
    it ('all content > thread > delete second thread', function(){
        var titre2='all content button thread'
        cy.get('.sidebar__content__navigation__workspace__item__submenu > li:nth-child(2)').click()
        cy.get('.pageTitleGeneric__title__icon').should('be.visible')
        cy.get('.content__name__text').contains(titre2).should('be.visible')
        cy.get('.content__name__text').contains(titre2).click()
        cy.get('.thread.visible').should('be.visible')
        cy.get('.thread.visible .wsContentGeneric__header__title').contains(titre2)
        cy.get('.thread.visible .align-items-center button:nth-child(2)').click()
        cy.get('.thread.visible .timeline__info__btnrestore').should('be.visible')
        cy.get('.thread.visible .thread__contentpage__header__close').click()
        cy.get('.thread.visible').should('not.be.visible')
    })
})