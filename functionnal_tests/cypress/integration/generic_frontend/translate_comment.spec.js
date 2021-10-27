import { PAGES } from '../../support/urls_commands'

describe('Comment translation', function () {
  const fileName = 'testFile'

  beforeEach(() => {
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
      cy.contains('.html-document__contentpage__timeline__comment__body__content', 'en')
      cy.get('[data-cy=commentTranslateButton]').click()
      cy.contains('.html-document__contentpage__timeline__comment__body__content', 'A beautiful comment')
    })

    it('a menu should allow to change the target language and translate in one click', () => {
      cy.get('[data-cy=commentTranslateButton__languageMenu]').click()
      cy.get('[data-cy=commentTranslateButton__language__fr]').click()
      cy.contains('.html-document__contentpage__timeline__comment__body__content', 'fr')
    })
  })
})
