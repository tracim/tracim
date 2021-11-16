import { PAGES as p } from '../../support/urls_commands.js'

describe('Note/html document translation', function () {
  beforeEach(() => {
    const workspaceId = 1
    let contentId = 1
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.createHtmlDocument('A Note', workspaceId).then(doc => {
      contentId = doc.content_id
    })
    cy.updateHtmlDocument(
      contentId,
      workspaceId,
      'Hello, world',
      'A Note'
    )
    cy.visitPage({
      pageName: p.CONTENT_OPEN,
      params: { workspaceId, contentType: 'html-document', contentId }
    })
  })

  it('should display a button and clicking on it should trigger the translation', () => {
    cy.get('[data-cy=htmlDocumentTranslateButton]').click()
    cy.contains('.wsContentHtmlDocument__contentpage__textnote', 'source_lang_code')
    cy.get('[data-cy=htmlDocumentTranslateButton]').click()
    cy.contains('.wsContentHtmlDocument__contentpage__textnote', 'Hello, world')
  })

  it('a menu should allow to change the target language and translate in one click', () => {
    cy.get('[data-cy=htmlDocumentTranslateButton__languageMenu]').click()
    cy.get('[data-cy=htmlDocumentTranslateButton__language__fr]').click()
    cy.contains('.wsContentHtmlDocument__contentpage__textnote', 'fr')
  })
})
