export function login (cy) {
    cy.visit('/login')
    cy.get('input[type=email]').should('be.visible')
    cy.get('input[type=email]').type('admin@admin.admin')
    cy.get('input[type=password]').type('admin@admin.admin')
    cy.get('.connection__form__btnsubmit').click()
}
