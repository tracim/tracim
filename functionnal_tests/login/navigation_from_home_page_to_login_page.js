describe('login :: navigate > disconnect', function () {
    before(function () {
        cy.visit('/login')
    })
    it('loging to home_page', function () {
        // type username
        cy.get('input[type=email]').type('admin@admin.admin').should('have.value','admin@admin.admin')
        // type password
        cy.get('input[type=password]').type('admin@admin.admin').should('have.value','admin@admin.admin')
        // click on button "connexion" also if name of button change
        cy.get('form').find('button').get('.connection__form__btnsubmit').click()
        // we should be redirected to /dashboard
        cy.url().should('include', 'http://localhost:6543/')
        cy.get('.profilgroup__name__imgprofil').should('have.attr','src')
        // for the moment we don't have name by default (26/07/2018)
        cy.get('.profilgroup__name__imgprofil').invoke('text').should('be.equal','')
    })
    it('logout from home_page', function() {
        cy.get('#dropdownMenuButton').click()
        cy.get('div.setting__link').click()
        cy.url().should('include', '/login')
    })
})