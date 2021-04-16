import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

let workspaceTest

describe('Dashboard button list', () => {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceTest = workspace
    })
  })

  beforeEach(() => {
    cy.loginAs('administrators')
    cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId: workspaceTest.workspace_id } })
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe('as a reader', () => {
    describe('if agenda is enabled', () => {
      it('should show button agenda and explore content', () => {
        cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId: workspaceTest.workspace_id } })
        cy.get('button[title="Open the agenda"]')
        cy.get('button[title="Explore contents"]')
      })
    })

    describe('if agenda is not enabled', () => {
      it('should show button explore content but not agenda', () => {
        cy.enableAgenda(workspaceTest, false)
        cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId: workspaceTest.workspace_id } })
        cy.get('button[title="Open the agenda"]').should('not.exist')
        cy.get('button[title="Explore contents"]')
      })
    })
  })
})
