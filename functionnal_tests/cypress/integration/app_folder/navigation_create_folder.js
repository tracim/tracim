// Not connected
// describe('navigate :: workspace > create_new > folder', function () {
//    before(function () {
//    //login
//        cy.visit('/login')
//        cy.get('input[type=email]').should('be.visible')
//        cy.get('input[type=email]').type('admin@admin.admin')
//        cy.get('input[type=password]').type('admin@admin.admin')
//        cy.get('.connection__form__btnsubmit').click()
//    })
//    after(function() {
//        cy.get('#dropdownMenuButton').click()
//        cy.get('div.setting__link').click()
//        cy.url().should('include', '/login')
//    })
//    it ('header button', function () {
//        cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label').click()
//        cy.get('.show .subdropdown__link__folder__icon').click()
//        cy.get('.createcontent__contentname').should('be.visible')
//        cy.get('.createcontent__form__input').should('have.attr', 'placeholder')
//        cy.get('.createcontent__form__input').type('folder1')
//        cy.get('.createcontent__form__input').should('have.attr', 'value', 'folder1')
//        cy.get('.cardPopup__close').click()
//        cy.get('.createcontent__contentname').should('not.be.visible')
//    })
//    it ('content button', function () {
//        cy.get('.workspace__content__button.dropdownCreateBtn .btn-primary').click()
//        cy.get('.show .subdropdown__link__folder__icon').click()
//        cy.get('.createcontent__contentname').should('be.visible')
//        cy.get('.createcontent__form__input').should('have.attr', 'placeholder')
//        cy.get('.createcontent__form__input').type('folder2')
//        cy.get('.createcontent__form__input').should('have.attr', 'value', 'folder2')
//        cy.get('.cardPopup__close').click()
//        cy.get('.createcontent__contentname').should('not.be.visible')
//    })
// })
