describe('navigate :: workspace > create_new > thread', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit('/ui/workspaces/1/contents')
  })
  it('allcontent > button', function () {
    cy.get('.pageTitleGeneric__title__icon').should('be.visible')
    cy.get('[data-cy=dropdownCreateBtn]').should('be.visible').click()
    cy.get('.show .fa-comments').should('be.visible').click()
  })
})
