describe('server > login page', function() {
    it('successfully loads', function() {
        cy.visit('/')
        // change URL to match your dev URL
        cy.url().should('include', 'http://localhost:6543/login')
    })
})
