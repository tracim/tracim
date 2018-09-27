describe('login :: navigate > disconnect', function () {
    before(function () {
        cy.visit('/login')
    })
    it('loging to home_page', function () {
        cy.get('input[type=email]').should('be.visible')
        cy.get('input[type=email]').type('admin@admin.admin').should('have.value','admin@admin.admin')
        cy.get('input[type=password]').type('admin@admin.admin').should('have.value','admin@admin.admin')
        cy.get('form').find('button').get('.connection__form__btnsubmit').click()
        cy.url().should('include', 'http://localhost:6543/')
        cy.get('.profilgroup__name__imgprofil').should('have.attr','src')
        cy.get('.profilgroup__name__imgprofil').invoke('text').should('be.equal','')
    })
    it('logout from home_page', function() {
        cy.get('#dropdownMenuButton').click()
        cy.get('div.setting__link').click()
        cy.url().should('include', '/login')
    })
})