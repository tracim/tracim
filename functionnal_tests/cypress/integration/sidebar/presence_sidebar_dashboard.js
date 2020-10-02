import { PAGES as p } from '../../support/urls_commands.js'

describe('Sidebar', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({
      pageName: p.HOME
    })
    cy.get('.sidebar__content__navigation__workspace__item__number').click()
  })
  it('should have a link to Dashboard in the hidden menu', function () {
    cy.get('.sidebar__content__navigation__workspace__item__menu').should('be.visible').click()
    cy.get('li').contains('Dashboard').should('have.attr', 'href', '/ui/workspaces/1/dashboard')
    cy.get('.fa-home').should('be.visible').click()
    cy.url().should('include', '/workspaces/1/dashboard')
    cy.get('.dashboard__header.pageTitleGeneric').should('be.visible')
  })
})
