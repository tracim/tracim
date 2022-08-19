import { PAGES as p } from '../../support/urls_commands.js'

describe('Sidebar', function () {
  let workspaceId, workspaceLabel
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      workspaceLabel = workspace.label
    })
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({
      pageName: p.HOME
    })
    cy.get('[data-cy=sidebar__space__item_1]').click()
  })
  it('should have a link to Dashboard in the hidden menu', function () {
    cy.get('.sidebar__item__menu').last().should('be.visible').click()
    cy.get('[data-cy="sidebar_subdropdown-dashboard"]')
      .should('have.attr', 'href', `/ui/workspaces/${workspaceId}/dashboard`)
      .should('be.visible')
      .click()
    cy.url().should('include', `/workspaces/${workspaceId}/dashboard`)
    cy.contains('.pageTitleGeneric__title__label', workspaceLabel)
  })
})
