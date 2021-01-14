import { PAGES as p } from '../../support/urls_commands'
import { SELECTORS as s } from '../../support/generic_selector_commands'

describe('Switching between workspaces', () => {
  let workspaceId
  let secondWorkspaceId
  const htmlDocTitle = 'first Html Doc'
  const secondHtmlDocTitle = 'second Html Doc'

  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createHtmlDocument(htmlDocTitle, workspaceId)
    })
    cy.createRandomWorkspace().then((workspace) => {
      secondWorkspaceId = workspace.workspace_id
      cy.createHtmlDocument(secondHtmlDocTitle, secondWorkspaceId)
    })
  })

  describe('with an open app', () => {
    it('should close current opened app', () => {
      cy.visitPage({ pageName: p.CONTENTS, params: { workspaceId: workspaceId } })
      cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: htmlDocTitle } }).find('.content__item').click('left')
      cy.getTag({ selectorName: s.CONTENT_FRAME }).contains(htmlDocTitle)

      cy.getTag({ selectorName: s.WORKSPACE_MENU, params: { workspaceId: secondWorkspaceId } }).click()

      cy.getTag({ selectorName: s.WORKSPACE_MENU, params: { workspaceId: secondWorkspaceId } })
        .contains('Contents')
        .click({ force: true })

      cy.getTag({ selectorName: s.CONTENT_FRAME }).should('not.exist')
    })
  })

  describe('between content list', () => {
    it.only('should reload contents', () => {
      cy.visitPage({ pageName: p.CONTENTS, params: { workspaceId: workspaceId } })
      cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: htmlDocTitle } })
      cy.getTag({ selectorName: s.WORKSPACE_MENU, params: { workspaceId: secondWorkspaceId } }).click()
      cy.getTag({ selectorName: s.WORKSPACE_MENU, params: { workspaceId: secondWorkspaceId } })
        .contains('Contents')
        .click({ force: true })

      cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: secondHtmlDocTitle } })
    })
  })
})
