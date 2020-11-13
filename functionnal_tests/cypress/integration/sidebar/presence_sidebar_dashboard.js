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
    cy.get('.sidebar__content__navigation__workspace__item__name').click()
  })
  it('should have a link to Dashboard in the hidden menu', function () {
    cy.get('.sidebar__content__navigation__workspace__item__menu').should('be.visible').click()
    cy.get('li').contains('Dashboard').should('have.attr', 'href', `/ui/workspaces/${workspaceId}/dashboard`)
    cy.get('[data-cy="sidebar_subdropdown-dashboard"]').should('be.visible').click()
    cy.url().should('include', `/workspaces/${workspaceId}/dashboard`)
    cy.contains('.dashboard__workspace__detail__title', workspaceLabel)
  })
})
