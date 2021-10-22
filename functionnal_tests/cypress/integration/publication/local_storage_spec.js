import { PAGES } from '../../support/urls_commands'

let workspaceId
const publishCommentArea = '#wysiwygTimelineCommentPublication'
const text = 'Hello world'

describe('News page', () => {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then((workspace) => {
      workspaceId = workspace.workspace_id
      cy.visitPage({
        pageName: PAGES.PUBLICATION,
        params: { workspaceId: workspace.workspace_id },
        waitForTlm: true
      })
    })
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it('should save the news draft', () => {
    cy.get(publishCommentArea).type(text)
    cy.visitPage({ pageName: PAGES.ACCOUNT })
    cy.contains('.account__userpreference__setting', 'Change my account settings')
    cy.visitPage({
      pageName: PAGES.PUBLICATION,
      params: { workspaceId: workspaceId },
      waitForTlm: true
    })
    cy.contains(publishCommentArea, text)
  })
})
