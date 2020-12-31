import { PAGES as p } from '../../support/urls_commands'

describe('Switching between tabs', () => {
  let workspaceId, workspaceLabel

  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      workspaceLabel = workspace.label
    })
  })

  afterEach(cy.cancelXHR)

  const testCases = [
    { from: 'Dashboard', to: 'Contents', fromPage: p.DASHBOARD, toPagePathEnd: 'contents' },
    { from: 'Dashboard', to: 'Activity feed', fromPage: p.DASHBOARD, toPagePathEnd: 'activity-feed' },
    { from: 'Activity feed', to: 'Dashboard', fromPage: p.WORKSPACE_ACTIVITY_FEED, toPagePathEnd: 'dashboard' },
    { from: 'Activity feed', to: 'Contents', fromPage: p.WORKSPACE_ACTIVITY_FEED, toPagePathEnd: 'contents' },
    { from: 'Contents', to: 'Dashboard', fromPage: p.CONTENTS, toPagePathEnd: 'dashboard' },
    { from: 'Contents', to: 'Activity feed', fromPage: p.CONTENTS, toPagePathEnd: 'activity-feed' }
  ]

  for (const testCase of testCases) {
    const { from, to, fromPage, toPagePathEnd } = testCase
    it(`Should go from ${from} to ${to}`, () => {
      cy.visitPage({ pageName: fromPage, params: { workspaceId: workspaceId } })
      cy.contains('.pageTitleGeneric__title__label', workspaceLabel)
      cy.contains('.tab', to).click()
      cy.contains('.breadcrumbs__item', to)
      cy.location('pathname').should('be.equal', `/ui/workspaces/${workspaceId}/${toPagePathEnd}`)
    })
  }
})
