import { PAGES as p } from '../../support/urls_commands.js'

describe('Sidebar and feature apps', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.createWorkspace('baseChildWorkspace')
  })

  beforeEach(function () {
    cy.visitPage({
      pageName: p.HOME
    })
  })

  it('should open the app maximized when the sidebar is closed', function () {
    cy.get('[title="Hide sidebar"]').click()
    cy.get('li[title="My space"] a[href]').first().click()
    cy.contains('.pageTitleGeneric__title__label', 'My space')
    cy.get('button[title="Space settings"]').click()
    cy.get('[data-cy="popinFixed"]').should('not.have.class', 'sidebarVisible')
    cy.get('[title="See sidebar"]').click()
    cy.get('[data-cy="popinFixed"]').should('have.class', 'sidebarVisible')
    cy.get('[title="Hide sidebar"]').click()
    cy.get('[data-cy="popinFixed"]').should('not.have.class', 'sidebarVisible')
  })
})
