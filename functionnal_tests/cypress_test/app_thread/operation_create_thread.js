describe('operation :: workspace > create_new > thread', function () {
    before(function () {
        //login
        cy.visit('/login')
        cy.get('input[type=email]').type('admin@admin.admin')
        cy.get('input[type=password]').type('admin@admin.admin')
        cy.get('form').find('button').get('.connection__form__btnsubmit').click()
    })
    it ('dashborad > button', function(){
        var titre1='thread1'
        cy.url().should('include', '/workspaces/1/dashboard')
        cy.get('.dashboard__calltoaction div:nth-child(3) .dashboard__calltoaction__button__text').should('be.visible')
        cy.get('.dashboard__calltoaction div:nth-child(3) .dashboard__calltoaction__button__text').click()
        cy.get('.createcontent .createcontent__contentname').should('be.visible')
        cy.get('.createcontent .createcontent__form__input').should('have.attr', 'placeholder')
        cy.get('.createcontent .createcontent__form__input').type(titre1)
        cy.get('.createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
        cy.get('.createcontent button.createcontent__form__button').click()
        cy.get('.createcontent  .createcontent__contentname').should('not.be.visible')
        cy.get('.thread.visible').should('be.visible')
        cy.get('#appFeatureContainer .wsContentGeneric__header__title').contains(titre1)
//        Problem to write text in iframe
//        cy.get('#wysiwygNewVersion_ifr').click()
//        cy.get('body').type('Ceci est le début du document')
//        cy.get('.html-document__editionmode__submit.editionmode__button__submit').click()
//        cy.get('.html-document__contentpage__textnote__text span').contains('Ceci est le début du document')
        cy.get('.thread__contentpage__header__close').click()
        cy.get('.thread.visible').should('not.be.visible')
//        Need improvement to verified new content is in list
//        cy.get('.workspace__content__fileandfolder .content__name__text').find(titre1)
    })
    it ('all content > header button ', function () {
        var titre1='thread1'
        cy.url().should('include', '/workspaces/1/contents')
        cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label').should('be.visible')
        cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label').click()
        cy.get('.show .subdropdown__link__thread').click()
        cy.get('.createcontent .createcontent__contentname').should('be.visible')
        cy.get('.createcontent .createcontent__form__input').should('have.attr', 'placeholder')
        cy.get('.createcontent .createcontent__form__input').type(titre1)
        cy.get('.createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
        cy.get('.createcontent button.createcontent__form__button').click()
        cy.get('.createcontent .createcontent__contentname').should('not.be.visible')
        cy.get('.thread.visible').should('be.visible')
        cy.get('#appFeatureContainer .wsContentGeneric__header__title').contains(titre1)
//        Problem to write text in iframe
//        cy.get('#wysiwygNewVersion_ifr').click()
//        cy.get('body').type('Ceci est le début du document')
//        cy.get('.html-document__editionmode__submit.editionmode__button__submit').click()
//        cy.get('.html-document__contentpage__textnote__text span').contains('Ceci est le début du document')
        cy.get('.thread__contentpage__header__close').click()
        cy.get('.thread.visible').should('not.be.visible')
//        Need improvement to verified new content is in list
//        cy.get('.workspace__content__fileandfolder .content__name__text').find(titre1)
    })

})