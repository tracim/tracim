import { login } from '../helpers/index.js'

describe('operation :: workspace > create_new > thread', function () {
    before(function () {
        login(cy)
    })
    after(function() {
        cy.get('#dropdownMenuButton').click()
        cy.get('div.setting__link').click()
        cy.url().should('include', '/login')
    })
    it ('dashborad > button', function(){
        var titre1='dashboard button thread'
        cy.url().should('include', '/workspaces/1/dashboard')
        cy.get('.dashboard__calltoaction .fa-comments-o').should('be.visible')
        cy.get('.dashboard__calltoaction .fa-comments-o').click()
        cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'placeholder')
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(titre1)
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
        cy.get('.cardPopup__container .createcontent button.createcontent__form__button').click()
        cy.get('.cardPopup__container .createcontent  .createcontent__contentname').should('not.be.visible')
        cy.get('.thread.visible').should('be.visible')
        cy.get('.thread.visible .wsContentGeneric__header__title').contains(titre1)
//        Problem to write text in iframe
//        cy.get('#wysiwygNewVersion_ifr').click()
//        cy.get('body').type('Ceci est le début du document')
//        cy.get('.html-document__editionmode__submit.editionmode__button__submit').click()
//        cy.get('.html-document__contentpage__textnote__text span').contains('Ceci est le début du document')
        cy.get('.thread.visible .thread__contentpage__header__close').click()
        cy.get('.thread.visible').should('not.be.visible')
//        Need improvement to verified new content is in list
//        cy.get('.workspace__content__fileandfolder .content__name__text').find(titre1)
    })
    it ('all content > header button ', function () {
        var titre2='all content button thread'
        cy.url().should('include', '/workspaces/1/contents')
        cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label').should('be.visible')
        cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label').click()
        cy.get('.show .subdropdown__link__thread').click()
        cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'placeholder')
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(titre2)
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'value', titre2)
        cy.get('.cardPopup__container .createcontent button.createcontent__form__button').click()
        cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('not.be.visible')
        cy.get('.thread.visible').should('be.visible')
        cy.get('.thread.visible .wsContentGeneric__header__title').contains(titre2)
//        Problem to write text in iframe
//        cy.get('#wysiwygNewVersion_ifr').click()
//        cy.get('body').type('Ceci est le début du document')
//        cy.get('.html-document__editionmode__submit.editionmode__button__submit').click()
//        cy.get('.html-document__contentpage__textnote__text span').contains('Ceci est le début du document')
        cy.get('.thread.visible .thread__contentpage__header__close').click()
        cy.get('.thread.visible').should('not.be.visible')
//        Need improvement to verified new content is in list
//        cy.get('.workspace__content__fileandfolder .content__name__text').find(titre1)
    })

})