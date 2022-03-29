import { PAGES as p } from '../../support/urls_commands'

describe('Mentions in publications', () => {
  let workspaceId
  let otherUserName

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.createWorkspace().then(workspace => {
      cy.createWorkspace('openWorkspace').then(workspace2 => {
        cy.createUser('baseOtherUser').then(user => {
          workspaceId = workspace2.workspace_id
          otherUserName = user.username
          cy.addUserToWorkspace(user.user_id, workspaceId)
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
        cy.get('#wysiwygTimelineCommentPublication').type(`${win.location.origin}/ui/workspaces/${workspaceId}/publications`)
      })
      cy.get('.commentArea__submit__btn').click()
      cy.get('.feedItem__publication__body__content a').click()
      cy.contains('.pageTitleGeneric__title__label', 'My OPEN space')
      cy.get('.publications__empty').should('be.visible')
      cy.get('#wysiwygTimelineCommentPublication').type(' @' + otherUserName + ' other words')
      cy.get('.commentArea__submit__btn')
        .should('be.visible')
        .click()
      cy.get('.feedItem__publication__body__content').contains('@' + otherUserName)
      // INFO - RJ - 2021-09-07 - The logic here is that an invalid mention message would prevent
      // posting and make the test fail
    })
  })
})
