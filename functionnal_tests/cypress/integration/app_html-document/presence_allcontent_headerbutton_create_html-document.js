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
    cy.get('[data-cy=dropdownCreateBtn]').should('be.visible').click()
    cy.get('.show .fa-file-text-o').should('be.visible').click()
  })
})
