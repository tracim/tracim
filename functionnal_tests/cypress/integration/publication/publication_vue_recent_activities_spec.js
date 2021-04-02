import { PAGES } from '../../support/urls_commands'

let workspaceId
const threadLabel = 'thread'
const publicationLabel = 'publication'

describe('In recent activities', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createThread(threadLabel, workspaceId)
      cy.createPublication(publicationLabel, workspaceId)
      cy.visitPage({ pageName: PAGES.WORKSPACE_RECENT_ACTIVITIES, params: { workspaceId } })
      cy.get('.feedItem__content')
      cy.get('.activityList').scrollIntoView()
    })
  })

  it('should have a specific icon and color for publication', () => {
    cy.contains('.feedItemHeader', publicationLabel)
      .find('.feedItemHeader__icon')
      .should('have.class', 'fa-stream')
      .should('have.css', 'color', 'rgb(102, 31, 152)')
  })

  it("should have the app's icon and color for other contents", () => {
    cy.contains('.feedItemHeader', threadLabel)
      .find('.feedItemHeader__icon')
      .should('have.class', 'fa-comments')
      // INFO - GB - 20210323 - see file backend/color-test.json for thread color
      .should('have.css', 'color', 'rgb(173, 76, 249)')
  })
})
