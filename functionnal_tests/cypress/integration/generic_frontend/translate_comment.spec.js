import { PAGES } from '../../support/urls_commands'

describe('Comment translation', function () {
  const fileName = 'testFile'

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.createHtmlDocument(fileName, 1)
    cy.createComment(1, 1, 'A beautiful comment')
    cy.visitPage({
      pageName: PAGES.CONTENT_OPEN,
      params: { workspaceId: 1, contentId: 1, contentType: 'html-document' }
    })
  })

  describe('Comment in timeline', function () {
    it('A translation button should be visible', function () {
      cy.contains('A beautiful comment')
      cy.get('[data-cy=commentTranslateButton]').click()
      cy.contains('source_lang_code')
      cy.get('[data-cy=commentTranslateButton]').click()
      cy.contains('A beautiful comment')
    })
  })
})
