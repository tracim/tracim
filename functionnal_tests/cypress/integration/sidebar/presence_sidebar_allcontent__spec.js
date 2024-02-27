import { PAGES } from '../../support/urls_commands'

describe('Sidebar', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
    cy.get('[data-cy=sidebar__space__item_1]').click()
  })
  it('should have a link to Contents in the hidden menu', function () {
    cy.get('.sidebar__item__menu').last().should('be.visible').click()
    cy.get('[data-cy="sidebar_subdropdown-contents/all"]')
      .should('have.attr', 'href', '/ui/workspaces/1/contents')
      .should('be.visible')
      .click()
    cy.url().should('include', '/workspaces/1/contents')
    cy.get('.workspace__content__file_and_folder').should('be.visible')
  })
})
