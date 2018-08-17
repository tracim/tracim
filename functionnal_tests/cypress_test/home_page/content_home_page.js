//describe('content :: home_page', function () {
//    before(function () {
//        //login
//        cy.visit('/login')
//        cy.get('input[type=email]').type('admin@admin.admin')
//        cy.get('input[type=password]').type('admin@admin.admin')
//        cy.get('form').find('button').get('.connection__form__btnsubmit').click()
//    })
//    it ('', function () {
//        cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label').click()
//        cy.get('.show .subdropdown__link__thread__icon').click()
//        cy.get('.createcontent__contentname').should('be.visible')
//        cy.get('.createcontent__form__input').should('have.attr', 'placeholder')
//        cy.get('.createcontent__form__input').type('thread1')
//        cy.get('.createcontent__form__input').should('have.attr', 'value', 'thread1')
//        cy.get('.cardPopup__close').click()
//        cy.get('.createcontent__contentname').should('not.be.visible')
//    })
//})
