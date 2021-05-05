import { PAGES } from '../../support/urls_commands'
import { SELECTORS as s, formatTag } from '../../support/generic_selector_commands'

let workspaceId

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
      cy.createHtmlDocument(htmlDocTitle, workspaceId)
    })
    cy.get(contentHtmlDocGetter).click()
    cy.get(cancelDocBtn).click()
  })

  it('should have translations', () => {
    cy.get('.timeline__title').contains('Timeline')

    cy.changeLanguage('fr')
    cy.get('.timeline__title').contains('Historique')

    cy.changeLanguage('pt')
    cy.get('.timeline__title').contains('Linha cronológica')

    cy.changeLanguage('de')
    cy.get('.timeline__title').contains('Zeitleiste')
  })
})
