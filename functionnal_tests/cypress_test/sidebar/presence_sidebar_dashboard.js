import { login, logout } from '../helpers/index.js'

describe('content :: home_page', function () {
    before(function () {
        login(cy)
    })
    after(function() {
        logout (cy)
    })
    it('', function () {
    cy.get('.sidebar__content .fa-chevron-up').should('be.visible')
    cy.get('li').contains('Dashboard').should('have.attr', 'href', '/workspaces/1/dashboard')
    cy.get('.fa-signal').should('be.visible')
    cy.get('.fa-signal').click()
    cy.url().should('include', '/workspaces/1/dashboard')
    cy.get('.dashboard__header.pageTitleGeneric').should('be.visible')
    })
})