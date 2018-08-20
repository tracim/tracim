describe('navigate :: create_new > workspace', function () {
    before(function () {
        //login
        cy.visit('/login')
        cy.get('input[type=email]').type('admin@admin.admin')
        cy.get('input[type=password]').type('admin@admin.admin')
        cy.get('form').find('button').get('.connection__form__btnsubmit').click()
    })
    it ('', function () {
        cy.url().should('include', '/workspaces/1/dashboard')
        cy.get('button.sidebar__content__btnnewworkspace__btn.btn').click()
        cy.get('.createcontent__contentname__title').should('be.visible')
        cy.get('.createcontent__form__input').should('have.attr', 'placeholder')
        cy.get('.createcontent__form__input').type('workspace1')
        cy.get('.createcontent__form__input').should('have.attr', 'value', 'workspace1')
        cy.get('.cardPopup__close').click()
        cy.get('.createcontent__contentname__title').should('not.be.visible')
    })
})
