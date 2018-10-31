describe('login :: navigate > disconnect', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  it('login and logout', function () {
    cy.visit('/login')
    cy.get('input[type=email]').should('be.visible')
    cy.get('input[type=email]').type('admin@admin.admin')
    cy.get('input[type=password]').should('be.visible')
    cy.get('input[type=password]').type('admin@admin.admin')
    cy.get('.connection__form__btnsubmit').should('be.visible')
    cy.get('.connection__form__btnsubmit').click()
    cy.get('#dropdownMenuButton.profilgroup__name.btn').click()
    cy.get('div.setting__link .fa-sign-out').click()
  })
})
