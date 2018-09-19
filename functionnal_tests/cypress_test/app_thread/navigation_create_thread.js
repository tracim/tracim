describe('navigate :: workspace > create_new > thread', function () {
    before(function () {
        //login
        cy.visit('/login')
        cy.get('input[type=email]').type('admin@admin.admin')
        cy.get('input[type=password]').type('admin@admin.admin')
        cy.get('form').find('button').get('.connection__form__btnsubmit').click()
    })
    it ('dashboard > button', function() {
        var titre1='thread1'
        cy.get('.dashboard__calltoaction div:nth-child(3) .dashboard__calltoaction__button__text').click()
        cy.get('.createcontent .createcontent__contentname').should('be.visible')
        cy.get('.createcontent .createcontent__form__input').should('have.attr', 'placeholder')
        cy.get('.createcontent .createcontent__form__input').type(titre1)
        cy.get('.createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
        cy.get('.cardPopup__container .cardPopup__close').click()
        cy.get('.createcontent .createcontent__contentname').should('not.be.visible')
    })
    it ('header button', function () {
        var titre1='thread1'
        cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label').click()
        cy.get('.show .subdropdown__link__thread__icon').click()
        cy.get('.createcontent .createcontent__contentname').should('be.visible')
        cy.get('.createcontent .createcontent__form__input').should('have.attr', 'placeholder')
        cy.get('.createcontent .createcontent__form__input').type(titre1)
        cy.get('.createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
        cy.get('.cardPopup__container .cardPopup__close').click()
        cy.get('.createcontent .createcontent__contentname').should('not.be.visible')
    })
    it ('content button', function () {
        var titre1='thread1'
        cy.get('.workspace__content__button.dropdownCreateBtn .__label').click()
        cy.get('.show .subdropdown__link__thread__icon').click()
        cy.get('.createcontent .createcontent__contentname').should('be.visible')
        cy.get('.createcontent .createcontent__form__input').should('have.attr', 'placeholder')
        cy.get('.createcontent .createcontent__form__input').type(titre1)
        cy.get('.createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
        cy.get('.cardPopup__container .cardPopup__close').click()
        cy.get('.createcontent .createcontent__contentname').should('not.be.visible')
    })
})
