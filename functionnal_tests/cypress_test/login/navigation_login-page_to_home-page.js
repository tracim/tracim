import { login, logout } from '../helpers/index.js'

describe('logging in tracim', function () {
    before(function () {
        login (cy)
    })
    after(function() {
        logout (cy)
    })
    it('', function () {
        cy.url().should('include', 'http://localhost:6543')
        cy.get('.profilgroup__name__imgprofil').should('have.attr','src')
        cy.get('.homepagecard.card').should('be.visible')
        // for the moment we don't have name by default (26/07/2018)
        cy.get('.profilgroup__name__imgprofil').invoke('text').should('be.equal','')
    })
})
