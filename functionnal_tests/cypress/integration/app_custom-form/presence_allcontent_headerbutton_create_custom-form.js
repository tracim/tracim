describe('navigate :: allcontent > headerbutton > create_new > custom-form', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  it('allcontent > button', function () {
    // TODO Custom_form tests are skipped for now, tests must be enabled when the app will be activated
    // see: https://github.com/tracim/tracim/issues/2895
    this.skip()
    cy.loginAs('users')
    cy.visit('/ui/workspaces/1/contents')
    cy.get('.pageTitleGeneric__title__icon').should('be.visible')
    cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label').should('be.visible')
    cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label').click()
    cy.get('.show .subdropdown__link__custom-form__icon').should('be.visible')
  })
})
