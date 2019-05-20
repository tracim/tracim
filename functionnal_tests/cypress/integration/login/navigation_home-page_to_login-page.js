describe('Login page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  it('should allow login and logout', function () {
    cy.visit('/ui/login')

    cy.get('input[type=email]').should('be.visible')
    cy.get('input[type=email]').type('admin@admin.admin')

    cy.get('input[type=password]').should('be.visible')
    cy.get('input[type=password]').type('admin@admin.admin')

    cy.get('.loginpage__card__form__btnsubmit').should('be.visible')
    cy.get('.loginpage__card__form__btnsubmit').click()

    cy.get('.menuprofil__dropdown__name.btn').click()

    cy.get('div.menuprofil__dropdown__setting__link .fa-sign-out').click()
  })
})
