import { login } from '../helpers/index.js'

describe('account :: main_page', function () {
    before(function () {
        login(cy)
    })
    it('', function () {
        cy.get('#dropdownMenuButton').should('be.visible')
        cy.get('#dropdownMenuButton').click()
        cy.get('a.setting__link[href="/account"]').should('be.visible')
        cy.get('a.setting__link[href="/account"]').click()
        cy.url().should('include', '/account')
        cy.get('.userinfo').should('be.visible')
    })
    after(function() {
        cy.get('#dropdownMenuButton').click()
        cy.get('div.setting__link').click()
        cy.url().should('include', '/login')
    })
})
