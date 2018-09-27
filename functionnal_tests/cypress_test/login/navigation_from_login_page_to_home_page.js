describe('logging in tracim', function () {
    before(function () {
        cy.visit('/login')
    })
    it('', function () {
        cy.get('input[type=email]').type('admin@admin.admin').should('have.value','admin@admin.admin')
        cy.get('input[type=password]').type('admin@admin.admin').should('have.value','admin@admin.admin')
        cy.get('form').find('button').get('.connection__form__btnsubmit').click()
        cy.url().should('include', 'http://localhost:6543/')
        cy.get('.profilgroup__name__imgprofil').should('have.attr','src')
        // for the moment we don't have name by default (26/07/2018)
        cy.get('.profilgroup__name__imgprofil').invoke('text').should('be.equal','')
    })
})
