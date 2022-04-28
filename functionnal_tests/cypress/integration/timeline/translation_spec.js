import { PAGES } from '../../support/urls_commands'
import { SELECTORS as s, formatTag } from '../../support/generic_selector_commands'

let workspaceId
let noteId

const htmlDocTitle = 'HtmlDoc'
const contentHtmlDocGetter = formatTag({ selectorName: s.CONTENT_IN_SEARCH, attrs: { title: htmlDocTitle } })

const cancelDocBtn = '.html-document__editionmode__cancel'

describe('Timeline', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.visitPage({ pageName: PAGES.CONTENTS, params: { workspaceId: workspaceId } })
      cy.createHtmlDocument(htmlDocTitle, workspaceId).then(note => noteId = note.content_id)
    })
    cy.get(contentHtmlDocGetter).click()
    cy.get(cancelDocBtn).click()
  })

  it('should have translations', () => {
    cy.contains('.wsContentGeneric__content__right__content__title', 'Timeline')

    cy.changeLanguage('fr')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: noteId } })
    cy.contains('.wsContentGeneric__content__right__content__title', 'Historique')

    cy.changeLanguage('pt')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: noteId } })
    cy.contains('.wsContentGeneric__content__right__content__title', 'Linha cronológica')

    cy.changeLanguage('de')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: noteId } })
    cy.contains('.wsContentGeneric__content__right__content__title', 'Zeitleiste')
  })
})
