import { login, logout } from '../helpers/index.js'

describe('navigate :: workspace > create_new > thread', function () {
    before(function () {
        login(cy)
    })
    after(function() {
        logout (cy)
    })
    it ('dashboard > button', function() {
        cy.visit('/workspaces/1/dashboard')
        cy.get('.pageWrapperGeneric .dashboard__workspace__detail').should('be.visible')
        cy.get('.dashboard__calltoaction .fa-comments-o').should('be.visible')
    })
})
