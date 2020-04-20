describe('navigate :: allcontent > headerbutton > create_new > custom-form', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  it('allcontent > button', function () {
    this.skip() // INFO - GM - 2020/04/20 - Skip custom_form tests for now
    cy.loginAs('users')
    cy.visit('/ui/workspaces/1/contents')
    cy.get('.pageTitleGeneric__title__icon').should('be.visible')
    cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label').should('be.visible')
    cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label').click()
    cy.get('.show .subdropdown__link__custom-form__icon').should('be.visible')
  })
})
