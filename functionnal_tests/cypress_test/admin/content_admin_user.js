import { login } from '../helpers/index.js'

//describe('navigation :: admin > user', function () {
//    before(function () {
//        //login
//        cy.visit('/login')
//        cy.get('input[type=email]').should('be.visible')
//        cy.get('input[type=email]').type('admin@admin.admin')
//        cy.get('input[type=password]').type('admin@admin.admin')
//        cy.get('.connection__form__btnsubmit').click()
//        cy.get('.adminlink__btn.dropdown-toggle').click()
//        cy.get('a.setting__link[href="/admin/user"]').click()
//        cy.url().should('include', '/admin/user')
//    })
//    after(function() {
//        cy.get('#dropdownMenuButton').click()
//        cy.get('div.setting__link').click()
//        cy.url().should('include', '/login')
//    })
//    it ('', function(){
//        cy.get('').should('')
//    })
//})