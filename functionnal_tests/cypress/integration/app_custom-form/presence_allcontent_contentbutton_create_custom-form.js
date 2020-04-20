describe('navigate :: allcontent > headerbutton > create_new > html-document', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  it('check id create button has a dropdown', function () {
    this.skip() // INFO - GM - 2020/04/20 - Skip custom_form tests for now
    cy.loginAs('users')
    cy.visit('/ui/workspaces/1/contents')
    cy.get('.pageTitleGeneric__title__icon').should('be.visible')
    cy.get('[data-cy=dropdownCreateBtn]').should('be.visible').click()
    cy.get('.show .subdropdown__link__custom-form__icon').should('be.visible')
  })
})
