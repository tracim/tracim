import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

let workspaceTest

describe('Dashboard button list', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceTest = workspace
    })
  })

  beforeEach(() => {
    cy.loginAs('administrators')
    cy.visitPage({pageName: p.DASHBOARD, params: {workspaceId: workspaceTest.workspace_id}})
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe('as a reader', () => {
    describe('if agenda is enabled', () => {
      beforeEach(() => {
        cy.createRandomUser().then( user => {
          cy.addUserToWorkspace(user.user_id, workspaceTest.workspace_id, 'reader')
          cy.login(user)
          cy.visitPage({pageName: p.DASHBOARD, params: {workspaceId: workspaceTest.workspace_id}})
        })
      })

      it('should show button agenda and explore content', () => {
        cy.get('[data-cy=contentTypeBtn_agenda]')
        cy.get('[data-cy="contentTypeBtn_contents/all"]')
      })
    })

    describe('if agenda is not enabled', () => {
      it('should show button explore content but not agenda', () => {
        cy.enableAgenda(workspaceTest, false)
        cy.createRandomUser().then(user => {
          cy.addUserToWorkspace(user.user_id, workspaceTest.workspace_id, 'reader')
          cy.login(user)
        })
        cy.visitPage({pageName: p.DASHBOARD, params: {workspaceId: workspaceTest.workspace_id}})
        cy.get('[data-cy=contentTypeBtn_agenda]').should('not.exist')
        cy.get('[data-cy="contentTypeBtn_contents/all"]')
      })
    })
  })

  it('should not have a button for share content', () => {
    cy.get('[data-cy=contentTypeBtn_share_content]').should('not.exist')
    cy.get('[data-cy="contentTypeBtn_contents/all"]')
  })

  it('should not have a button for upload permissions', () => {
    cy.get('[data-cy=contentTypeBtn_upload_permission]').should('not.exist')
    cy.get('[data-cy="contentTypeBtn_contents/all"]')
  })
})
