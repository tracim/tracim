describe('navigate :: allcontent > headerbutton > create_new > html-document', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
  })
  it('allcontent > button', function () {
    cy.visit('/ui/workspaces/1/contents')
    cy.get('.pageTitleGeneric__title__icon').should('be.visible')
    cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label').should('be.visible')
    cy.get('#dropdownCreateBtn.workspace__header__btnaddcontent__label').click()
    cy.get('.show .subdropdown__link__html-document__icon').should('be.visible')
  })
})
