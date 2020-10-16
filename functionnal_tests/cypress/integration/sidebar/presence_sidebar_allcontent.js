describe('Sidebar', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit('/ui')
    cy.get('.sidebar__content__navigation__workspace__item__name').click()
  })
  it('should have a link to All contents in the hidden menu', function () {
    cy.get('.sidebar__content__navigation__workspace__item__menu').should('be.visible').click()
    cy.get('li').contains('All Contents').should('have.attr', 'href', '/ui/workspaces/1/contents')
    cy.get('[data-cy="sidebar_subdropdown-contents/all"]').should('be.visible')
    cy.get('[data-cy="sidebar_subdropdown-contents/all"]').click()
    cy.url().should('include', '/workspaces/1/contents')
    cy.get('.workspace__header.pageTitleGeneric').should('be.visible')
  })
})
