import { PAGES } from '../../support/urls_commands'

const text = 'Hello world'
let spaceId

describe('News page', () => {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then((workspace) => {
      spaceId = workspace.workspace_id
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
    cy.inputInTinyMCE(text)
    cy.visitPage({ pageName: PAGES.ACCOUNT })
    cy.contains('.account__userpreference__setting', 'Change my account settings')
    cy.visitPage({
      pageName: PAGES.PUBLICATION,
      params: { workspaceId: spaceId },
      waitForTlm: true
    })
    cy.getActiveTinyMCEEditor().then((editor) => {
      expect(editor.getContent()).to.contain(text)
    })
  })
})
