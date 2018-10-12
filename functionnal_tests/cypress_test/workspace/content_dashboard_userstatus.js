import { login, logout } from '../helpers/index.js'

describe('content :: workspace > dashbord', function () {
    before(function () {
        login(cy)
        cy.visit('/workspaces/1/dashboard')
        cy.url().should('include', '/workspaces/1/dashboard')
    })
    after(function() {
        logout (cy)
    })
    it ('dashboard__workspace > userstatus', function() {
        cy.get('.dashboard__workspace .userstatus').should('be.visible')
        cy.get('.userstatus .userstatus__username').should('be.visible')
        cy.get('.userstatus .userstatus__role').should('be.visible')
        cy.get('.userstatus .userstatus__notification').should('be.visible')
        cy.get('.userstatus .userstatus__notification__icon').should('be.visible')
        cy.get('.userstatus .userstatus__notification__icon .fa-envelope-open-o').should('be.visible')
        cy.get('.userstatus .userstatus__notification__text').should('be.visible')
    })
})
