describe('content :: workspace > dashboard', function () {
    before(() => {
        cy.resetDB()
        cy.setupBaseDB()
    })

    beforeEach(function () {
        cy.loginAs('administrators')
        cy.visit('/ui/workspaces/1/dashboard')
    })

    it('workspace_advanced > change description', function () {
        cy.get('.dashboard__header__advancedmode__button').should('be.visible').click()

        var newDescription = 'myNewDescription'
        cy.get('.workspace_advanced__description__text__textarea').should('be.visible').clear()
        cy.get('.workspace_advanced__description__text__textarea').should('be.visible').type(newDescription)
        cy.get('.workspace_advanced__description__bottom__btn').should('be.visible').click()
        cy.get('.workspace_advanced__header__close').should('be.visible').click()
        cy.get('.dashboard__workspace__detail__description').should('be.visible').contains(newDescription)
    })
})
