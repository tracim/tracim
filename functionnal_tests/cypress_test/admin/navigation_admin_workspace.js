import { login } from '../helpers/index.js'

describe('navigation :: admin > workspace', function () {
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
        cy.get('a[href="/admin/workspace"]').click()
        cy.url().should('include', '/admin/workspace')
        cy.get('.adminWorkspace__description').should('be.visible')
    })
})