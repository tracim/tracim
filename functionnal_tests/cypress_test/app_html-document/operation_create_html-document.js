describe('operation :: workspace > create_new > html-document', function () {
    before(function () {
        cy.visit('/login')
        cy.get('input[type=email]').type('admin@admin.admin')
        cy.get('input[type=password]').type('admin@admin.admin')
        cy.get('form').find('button').get('.connection__form__btnsubmit').click()
    })
    it ('dashborad > button', function(){
        var titre1='dashboard button'
        cy.url().should('include', '/workspaces/1/dashboard')
        cy.get('.dashboard__calltoaction .fa-file-text-o').should('be.visible')
        cy.get('.dashboard__calltoaction .fa-file-text-o').click()
        cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'placeholder')
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(titre1)
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
        cy.get('.cardPopup__container .createcontent .createcontent__form__button.btn-primary').click()
        cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('not.be.visible')
        cy.get('.html-document.visible').should('be.visible')
        cy.get('#appFeatureContainer .wsContentGeneric__header__title').contains(titre1)
//        Problem to write text in iframe
//        cy.get('#wysiwygNewVersion_ifr').click()
//        cy.get('body').type('Ceci est le début du document')
//        cy.get('.html-document__editionmode__submit.editionmode__button__submit').click()
//        cy.get('.html-document__contentpage__textnote__text span').contains('Ceci est le début du document')
        cy.get('.html-document__header__close').should('be.visible')
        cy.get('.html-document__header__close').click()
        cy.get('.html-document.visible').should('not.be.visible')
//        Need improvement to verified new content is in list
//        cy.get('.workspace__content__fileandfolder .content__name__text').find(titre1)
    })
    it ('all content > header button ', function () {
        var titre2='all content button'
        cy.url().should('include', '/workspaces/1/contents')
        cy.get('.workspace__header__btnaddcontent__label').should('be.visible')
        cy.get('.workspace__header__btnaddcontent__label').click()
        cy.get('.workspace__header__btnaddcontent__setting .subdropdown__link__html-document').click()
        cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'placeholder')
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(titre2)
        cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'value', titre2)
        cy.get('.cardPopup__container .createcontent .createcontent__form__button.btn-primary').click()
        cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('not.be.visible')
        cy.get('.html-document.visible', {timeout: 2000}).should('be.visible')
        cy.get('.html-document.visible .wsContentGeneric__header__title').should('be.visible')
        cy.get('.html-document.visible .wsContentGeneric__header__title').contains(titre2)
        cy.get('.html-document.visible .html-document__header__close').should('be.visible')
        cy.get('.html-document.visible .html-document__header__close').click()
        cy.get('.html-document.visible').should('not.be.visible')
//        Need improvement to verified new content is in list
//        cy.get('.workspace__content__fileandfolder .content__name__text').find(titre1)
    })

})
