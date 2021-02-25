import { PAGES as p } from '../../support/urls_commands.js'

describe('Note/html document translation', function () {
  before(() => {
    const workspaceId = 1
    let contentId = 1
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.createHtmlDocument("A Note", workspaceId).then(doc => {
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

  it('should display a button', () => {
    cy.get('[data-cy=htmlDocumentTranslationButton]')
  })
})
