// Not connected
//describe('navigate :: workspace > create_new > file', function () {
//    before(function () {
//    //login
//        cy.visit('/login')
//        cy.get('input[type=email]').type('admin@admin.admin')
//        cy.get('input[type=password]').type('admin@admin.admin')
//        cy.get('form').find('button').get('.connection__form__btnsubmit').click()
//    })
//    it ('header button', function () {
//        cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label').click()
//        cy.get('.show .subdropdown__link__file__icon').click()
//        cy.get('.createcontent__contentname').should('be.visible')
//        cy.get('.createcontent__form__input').should('have.attr', 'placeholder')
//        cy.get('.createcontent__form__input').type('file1')
//        cy.get('.createcontent__form__input').should('have.attr', 'value', 'file1')
//        cy.get('.cardPopup__close').click()
//        cy.get('.createcontent__contentname').should('not.be.visible')
//    })
//    it ('content button', function () {
//        cy.get('.workspace__content__button.dropdownCreateBtn .btn-primary').click()
//        cy.get('.show .subdropdown__link__file__icon').click()
//        cy.get('.createcontent__contentname').should('be.visible')
//        cy.get('.createcontent__form__input').should('have.attr', 'placeholder')
//        cy.get('.createcontent__form__input').type('file2')
//        cy.get('.createcontent__form__input').should('have.attr', 'value', 'file2')
//        cy.get('.cardPopup__close').click()
//        cy.get('.createcontent__contentname').should('not.be.visible')
//    })
//})
