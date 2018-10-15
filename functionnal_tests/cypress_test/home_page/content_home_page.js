import { login, logout } from '../helpers/index.js'

describe('content :: home_page', function () {
    before(function () {
        login (cy)
    })
    after(function() {
        logout (cy)
    })
    it ('', function () {
        cy.get('section.homepage').should('be.visible')
        cy.get('.homepagecard__title').should('be.visible')
        cy.get('.homepagecard__user').should('be.visible')
        cy.get('.homepagecard__delimiter').should('be.visible')
        cy.get('.homepagecard__text').should('be.visible')
        cy.get('.homepagecard__endtext').should('be.visible')
    })
})
