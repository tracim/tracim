import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

describe('Dashboard button list', () => {

  beforeEach(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe('as a reader', () => {
    describe('if agenda is enabled', () => {
      beforeEach(() => {
        cy.fixture('baseWorkspace').then(workspace => {
          cy.createRandomUser().then( user => {
            cy.log(workspace)
            cy.addUserToWorkspace(user.user_id, workspace.workspace_id, 'reader')
            cy.logout()
            cy.login(user)
            cy.visitPage({pageName: p.DASHBOARD, params: {workspaceId: workspace.workspace_id}})
          })
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
})
