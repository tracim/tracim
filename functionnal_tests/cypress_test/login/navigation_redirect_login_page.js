import { login } from '../helpers/index.js'

describe('server > login page', function() {
    it('successfully loads', function() {
        login(cy)
        // change URL to match your dev URL
        cy.url().should('include', 'http://localhost:6543/login')
    })
})
