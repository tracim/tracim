describe('account :: main_page', function () {
    before(function () {
        //login
        cy.visit('/login')
        cy.get('input[type=email]').type('admin@admin.admin')
        cy.get('input[type=password]').type('admin@admin.admin')
        cy.get('form').find('button').get('.connection__form__btnsubmit').click()
    })
    it('', function () {
//        cy.visit('/account')
//        cy.url().should('include', '/account')
        cy.get('#dropdownMenuButton').should('be.visible')
        cy.get('#dropdownMenuButton').click()
        cy.get('a.setting__link[href="/account"]').should('be.visible')
        cy.get('a.setting__link[href="/account"]').click()
        cy.url().should('include', '/account')
        cy.get('.userinfo').should('be.visible')
    })
})
