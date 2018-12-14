describe('content :: home_page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit('/')
    cy.get('.sidebar__content__navigation__workspace__item__number').click()
  })
  it('', function () {
    cy.get('.sidebar__content .fa-chevron-up').should('be.visible')
    cy.get('li').contains('Threads').should('have.attr', 'href', '/ui/workspaces/1/contents?type=thread')
    cy.get('.fa-comments-o').should('be.visible')
    cy.get('.fa-comments-o').click()
    cy.url().should('include', '/workspaces/1/contents?type=thread')
    cy.get('.workspace__header.pageTitleGeneric').should('be.visible')
  })
})
