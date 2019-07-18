describe('content :: workspace > dashboard > workspace_advanced', function () {
    beforeEach(function () {
        cy.resetDB()
        cy.setupBaseDB()
        cy.loginAs('administrators')
        cy.fixture('baseWorkspace').as('workspace').then(workspace => {
            cy.visit(`/ui/workspaces/${workspace.workspace_id}/dashboard`)
        })
    })

    it('workspace_advanced > change description', function () {
        cy.get('.dashboard__header__advancedmode__button').should('be.visible').click()

        const newDescription = 'myNewDescription'
        cy.get('.workspace_advanced__description__text__textarea').should('be.visible').clear()
        cy.get('.workspace_advanced__description__text__textarea').should('be.visible').type(newDescription)
        cy.get('.workspace_advanced__description__bottom__btn').should('be.visible').click()
        cy.get('.dashboard__workspace__detail__description').should('be.visible').contains(newDescription)
    })
})
