import { PAGES, URLS } from '../../support/urls_commands.js'
import user from '../../fixtures/defaultAdmin.json'

describe("At the user's recent activities page", () => {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
  })

  beforeEach(() => {
    cy.loginAs('administrators')
    cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, waitForTlm: true })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('when arriving on the recent activities page', () => {
    it("should display other user's username when they are mentioned", () => {
      cy.fixture('baseWorkspace').as('workspace').then(workspace => {
        cy.fixture('baseUser').as('workspace').then(user => {
          const workspaceId = workspace.workspace_id
          const userId = user.user_id
          const username = user.username
          cy.createPublication('hello there', workspaceId)
          cy.createComment(workspaceId, 1, `general kenobi<html-mention userId=${userId}></html-mention>`)
          cy.get('.mention').first().contains(username)
        })
      })
    })
  })
})
