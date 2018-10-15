import { login, logout } from '../helpers/index.js'

describe('navigation :: admin > user', function () {
    before(function () {
        login(cy)
    })
    after(function() {
        logout (cy)
    })
    it ('', function() {
        cy.get('.adminlink.dropdown').should('be.visible')
        cy.get('.adminlink.dropdown').click()
        cy.get('[href="/admin/user"]').should('be.visible')
        cy.get('[href="/admin/user"]').click()
        cy.url().should('include', '/admin/user')
        cy.get('.adminUser__description').should('be.visible')
    })
})