describe('navigation :: admin > workspace', function () {
    before(function () {
        //login
        cy.visit('/login')
        cy.get('input[type=email]').should('be.visible')
        cy.get('input[type=email]').type('admin@admin.admin')
        cy.get('input[type=password]').type('admin@admin.admin')
        cy.get('form').find('button').get('.connection__form__btnsubmit').click()
    })
    after(function() {
        cy.get('#dropdownMenuButton').click()
        cy.get('div.setting__link').click()
        cy.url().should('include', '/login')
    })
    it ('', function() {
        cy.get('.adminlink.dropdown').should('be.visible')
        cy.get('.adminlink.dropdown').click()
        cy.get('a[href="/admin/workspace"]').click()
        cy.url().should('include', '/admin/workspace')
        cy.get('.adminWorkspace__description').should('be.visible')
    })
})