import { PAGES } from '../../support/urls_commands'

let workspaceId
const noteTitle = 'Note'
const text = 'Hello world'

describe('Notes', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createHtmlDocument(noteTitle, workspaceId)
      cy.visitPage({ pageName: PAGES.CONTENTS, params: { workspaceId: workspaceId } })
    })

  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it.skip('should save the note draft', () => {
    // FIXME - RJ - 2022-02-16 - disabled test (see #5436)
    cy.contains('[data-cy=FilenameWithBadges__label]', noteTitle).click()
    cy.waitForHugeRTELoaded()
      .then(() => cy.typeInHugeRTE(text))
    cy.visitPage({ pageName: PAGES.ACCOUNT })
    cy.contains('.account__userpreference__setting', 'Change my account settings')
    cy.visitPage({ pageName: PAGES.CONTENTS, params: { workspaceId: workspaceId } })
    cy.contains('[data-cy=FilenameWithBadges__label]', noteTitle).click()
    cy.waitForHugeRTELoaded()
      .then(() => cy.assertHugeRTEContent(text))
  })
})
