import { PAGES } from '../../support/urls_commands'

let workspaceId
const noteTitle = 'Note'
const text = 'Hello world'

describe('Timeline', () => {
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

  it('should save the comment draft', () => {
    cy.contains('[data-cy=FilenameWithBadges__label]', noteTitle).click()
    cy.get('.editionmode__button__cancel').click()
    cy.inputInTinyMCE(text)
    cy.visitPage({ pageName: PAGES.ACCOUNT })
    cy.contains('.account__userpreference__setting', 'Change my account settings')
    cy.visitPage({ pageName: PAGES.CONTENTS, params: { workspaceId: workspaceId } })
    cy.contains('[data-cy=FilenameWithBadges__label]', noteTitle).click()
    cy.get('.editionmode__button__cancel').click()
    cy.getActiveTinyMCEEditor().then((editor) => {
      expect(editor.getContent()).to.contain(text)
    })
  })
})
