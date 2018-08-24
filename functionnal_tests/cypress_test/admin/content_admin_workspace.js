describe('content :: admin > workspace', function () {
    before(function () {
        //login
        cy.visit('/login')
        cy.get('input[type=email]').type('admin@admin.admin')
        cy.get('input[type=password]').type('admin@admin.admin')
        cy.get('form').find('button').get('.connection__form__btnsubmit').click()
        cy.get('.adminlink__btn.dropdown-toggle').click()
        cy.get('a.setting__link[href="/admin/workspace"]').click()
        cy.url().should('include', '/admin/workspace')
    })
    it ('', function(){
        cy.get('.adminWorkspacePage__description').should('be.visible')
        cy.get('.adminWorkspacePage__delimiter').should('be.visible')
        cy.get('.adminWorkspacePage__workspaceTable').should('be.visible')
    })
    it ('content of workspaceTable', function(){
        cy.get('.adminWorkspacePage__workspaceTable th:nth-child(1)[scope="col"]').should('be.visible')
        cy.get('.adminWorkspacePage__workspaceTable th:nth-child(2)[scope="col"]').should('be.visible')
        cy.get('.adminWorkspacePage__workspaceTable th:nth-child(3)[scope="col"]').should('be.visible')
        cy.get('.adminWorkspacePage__workspaceTable th:nth-child(4)[scope="col"]').should('be.visible')
        cy.get('.adminWorkspacePage__workspaceTable th:nth-child(5)[scope="col"]').should('be.visible')
    })
})