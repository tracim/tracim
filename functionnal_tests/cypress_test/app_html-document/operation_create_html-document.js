import { login } from '../helpers/index.js'

describe('operation :: workspace > create_new > html-document', function () {
    before(function () {
        login(cy)
    })
    after(function() {
        cy.get('#dropdownMenuButton').click()
        cy.get('div.setting__link').click()
        cy.url().should('include', '/login')
    })
    it ('dashborad > button', function(){
        var titre1='dashboard button html'
        cy.get('.dashboard__calltoaction .fa-file-text-o').should('be.visible')
        cy.get('.dashboard__calltoaction .fa-file-text-o').click()
        cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'placeholder')
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(titre1)
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
        cy.get('.cardPopup__container .createcontent .createcontent__form__button.btn-primary').click()
        cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('not.be.visible')
        cy.get('.html-document.visible').should('be.visible')
        cy.get('.html-document.visible .html-document__contentpage__messagelist__version.revision').should('be.visible')
        cy.get('.html-document.visible .wsContentGeneric__header__title').contains(titre1)
        cy.get('.html-document.visible .html-document__header__close').should('be.visible')
        cy.get('.html-document.visible .html-document__header__close').click()
        cy.get('.html-document.visible').should('not.be.visible')
        cy.get('.content__name__text').contains(titre1).should('be.visible')
//    })
//    it ('all content > header button ', function () {
        var titre2='all content button html'
        cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label.dropdownCreateBtn__label').should('be.visible')
        cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label.dropdownCreateBtn__label').click()
        cy.get('.show .workspace__header__btnaddcontent__setting .subdropdown__link__html-document').should('be.visible')
        cy.get('.show .workspace__header__btnaddcontent__setting .subdropdown__link__html-document').click()
        cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'placeholder')
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(titre2)
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'value', titre2)
        cy.get('.cardPopup__container .createcontent .createcontent__form__button.btn-primary').click()
        cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('not.be.visible')
        cy.get('.html-document.visible').should('be.visible')
        cy.get('.html-document.visible .html-document__contentpage__messagelist__version.revision').should('be.visible')
        cy.get('.html-document.visible .wsContentGeneric__header__title').contains(titre1)
        cy.get('.html-document.visible .html-document__header__close').should('be.visible')
        cy.get('.html-document.visible .html-document__header__close').click()
        cy.get('.html-document.visible').should('not.be.visible')
        cy.get('.content__name__text').contains(titre2).should('be.visible')
//        Problem to write text in iframe
//        cy.get('#wysiwygNewVersion_ifr').click()
//        cy.get('body').type('Ceci est le début du document')
//        cy.get('.html-document__editionmode__submit.editionmode__button__submit').click()
//        cy.get('.html-document__contentpage__textnote__text span').contains('Ceci est le début du document')
    })

})
