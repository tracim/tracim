import { PAGES as p } from '../../support/urls_commands'

describe('Mentions in publications', () => {
  let workspaceId1
  let workspaceId2
  let otherUserName

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.createWorkspace().then(workspace => {
      workspaceId1 = workspace.workspace_id
      cy.createWorkspace().then(workspace2 => {
        cy.createUser('baseOtherUser').then(user => {
          workspaceId2 = workspace2.workspace_id
          otherUserName = user.username
          cy.addUserToWorkspace(user.user_id, workspaceId2)
          cy.visitPage({
            pageName: p.PUBLICATION,
            params: { workspaceId: workspace.workspace_id },
            waitForTlm: true
          })
        })
      })
    })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('publications, coming from an other workspace', () => {
    it('should allow mentioning a user not in that other workspace', () => {
      cy.window().then((win) => {
        cy.get('#wysiwygTimelineCommentPublication').type(`${win.location.origin}/ui/workspaces/${workspaceId2}/publications`)
      })
      cy.get('.commentArea__submit__btn').click()
      cy.get('.feedItem__publication__body__content a').click()
      cy.get('.publications__empty').should('be.visible')
      cy.get('#wysiwygTimelineCommentPublication').type('@' + otherUserName)
      cy.get('.autocomplete__item__active').should('be.visible').click()
      cy.get('.commentArea__submit__btn').click()
      cy.get('.feedItem__publication__body__content').contains('@' + otherUserName)
      // INFO - RJ - 2021-09-07 - The logic here is that an invalid mention message would prevent
      // posting and make the test fail
    })
  })
})
