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
    it ('part of dashbord', function () {
        cy.get('.dashboard.pageWrapperGeneric').should('be.visible')
        cy.get('.dashboard__header.pageTitleGeneric').should('be.visible')
        cy.get('.dashboard .pageContentGeneric').should('be.visible')
    })
    it ('dashboard__header__title', function() {
        cy.get('.pageTitleGeneric .dashboard__header__title').should('be.visible')
        cy.get('.pageTitleGeneric .dashboard__header__advancedmode').should('be.visible')
        cy.get('.pageTitleGeneric .dashboard__header__advancedmode__button').should('have.attr', 'type', 'button').should('be.visible')
    })
    it ('dashboard__workspace > dashboard__workspace__detail', function() {
        cy.get('.pageContentGeneric .dashboard__workspace__detail__title').should('be.visible')
        cy.get('.pageContentGeneric .dashboard__workspace__detail__description').should('not.be.visible')
    })
})
