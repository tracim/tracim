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
    cy.get('li').contains('Threads').should('have.attr', 'href', '/workspaces/1/contents?type=thread')
    cy.get('.fa-comments-o').should('be.visible')
    cy.get('.fa-comments-o').click()
    cy.url().should('include', '/workspaces/1/contents?type=thread')
    cy.get('.workspace__header.pageTitleGeneric').should('be.visible')
    })
})