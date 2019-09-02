import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

let workspaceId

describe('Dashboard button list', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
    })
  })

  beforeEach(() => {
    cy.loginAs('administrators')
    cy.visitPage({pageName: p.DASHBOARD, params: {workspaceId: workspaceId}})
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe('as a reader', () => {
    describe('if agenda is enabled', () => {
      beforeEach(() => {
        cy.createRandomUser().then( user => {
          cy.addUserToWorkspace(user.user_id, workspaceId, 'reader')
          cy.login(user)
          cy.visitPage({pageName: p.DASHBOARD, params: {workspaceId: workspaceId}})
        })
      })

      it('should show button agenda and explore content', () => {
        cy.get('[data-cy=contentTypeBtn_agenda]')
        cy.get('[data-cy="contentTypeBtn_contents/all"]')
      })
    })

    describe('if agenda is not enabled', () => {
      beforeEach(() => {
        cy.fixture('baseWorkspace').then(workspace => {
          cy.createRandomUser().then(user => {
            cy.log(workspace)
            cy.enableAgenda(workspace, false)
            cy.addUserToWorkspace(user.user_id, workspace.workspace_id, 'reader')
            cy.logout()
            cy.login(user)
            cy.visitPage({pageName: p.DASHBOARD, params: {workspaceId: workspace.workspace_id}})
          })
        })
      })

      it('should show button explore content but not agenda', () => {
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
