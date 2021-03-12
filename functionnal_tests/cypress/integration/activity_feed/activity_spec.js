import { PAGES, URLS } from '../../support/urls_commands.js'
import user from '../../fixtures/defaultAdmin.json'

let workspaceId
let fileId
const fileTitle = 'FileTitle'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'

describe('At the space recent activities page', () => {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId).then(content => {
        fileId = content.content_id
      })
    })
  })

  beforeEach(() => {
    cy.loginAs('administrators')
    cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, params: { workspaceId }, waitForTlm: true })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('at last change of one activity of any type', () => {
    it("should redirect to user's profile if click at author name", () => {
      cy.contains('[data-cy=feedItemHeader__label]', fileTitle)
      cy.get('.timedEvent__author').first().click()
      cy.url().should('include', URLS[PAGES.PROFILE]({ userId: user.user_id }))
    })
  })
})
