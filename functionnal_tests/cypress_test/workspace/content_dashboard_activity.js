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
    it ('dashboard__workspaceInfo > activity', function() {
        cy.get('.activity .activity__header__title').should('be.visible')
        cy.get('.activity .activity__header__allread').should('be.visible')
        cy.get('.activity .activity__wrapper').should('be.visible')
        cy.get('.activity .activity__wrapper .activity__empty').should('be.visible')
        cy.get('.activity .activity__wrapper button.activity__more__btn').should('be.visible')
    })
})
