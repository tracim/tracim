describe('navigate :: allcontent > headerbutton > create_new > html-document', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  it('check id create button has a dropdown', function () {
    // TODO Custom_form tests are skipped for now, tests must be enabled when the app will be activated
    // see: https://github.com/tracim/tracim/issues/2895
    this.skip()
    cy.loginAs('users')
    cy.visit('/ui/workspaces/1/contents')
    cy.get('.pageTitleGeneric__title__icon').should('be.visible')
    cy.get('[data-cy=dropdownCreateBtn]').should('be.visible').click()
    cy.get('.show .subdropdown__link__custom-form__icon').should('be.visible')
  })
})
