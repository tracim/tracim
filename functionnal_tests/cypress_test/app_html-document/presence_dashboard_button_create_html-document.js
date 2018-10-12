import { login, logout } from '../helpers/index.js'

describe('navigate :: workspace > create_new > html-document', function () {
    before(function () {
        login(cy)
    })
    after(function() {
        logout (cy)
    })
    it ('test all button', function() {
        cy.visit('/workspaces/1/dashboard')
        cy.get('.pageWrapperGeneric .dashboard__workspace__detail').should('be.visible')
        cy.get('.dashboard__calltoaction .fa-file-text-o').should('be.visible')
    })
})
