import { login } from '../helpers/index.js'

describe('navigation :: admin > user', function () {
    before(function () {
        login(cy)
    })
    after(function() {
        cy.get('#dropdownMenuButton').click()
        cy.get('div.setting__link').click()
        cy.url().should('include', '/login')
    })
    it ('', function() {
        cy.get('.adminlink.dropdown').should('be.visible')
        cy.get('.adminlink.dropdown').click()
        cy.get('a[href="/admin/user"]').click()
        cy.url().should('include', '/admin/user')
        cy.get('.adminUser__description').should('be.visible')
    })
})