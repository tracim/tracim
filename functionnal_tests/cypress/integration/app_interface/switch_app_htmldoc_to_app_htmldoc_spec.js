import {create_htmldocument} from '../helpers/htmldoc.js'

describe('Switch from app Htmldoc to app Htmldoc', () => {
  const htmlDocTitle = 'HtmlDocForSwitch'
  const contentHtmlDocGetter = `.workspace__content__fileandfolder > .content[title="${htmlDocTitle}"]`
  let workspaceId

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.visit(`/ui/workspaces/${workspaceId}/contents`)

      create_htmldocument(cy, htmlDocTitle)
      cy.get('[data-cy="popinFixed__header__button__close"]').should('be.visible').click()
    })
  })

  it("should hide the app Htmldoc and set it visible again", () => {
    cy.visit(`/ui/workspaces/${workspaceId}/contents`, {retryOnStatusCodeFailure: true})

    cy.get(contentHtmlDocGetter).click('left')
    cy.waitForTinyMCELoaded().then(() => {
      cy.get('[data-cy="popinFixed__header__button__close"]').should('be.visible').click()
      cy.get('[data-cy="popinFixed"].html-document').should('be.not.visible')

      cy.get(contentHtmlDocGetter).click('left')
      cy.waitForTinyMCELoaded().then(() => {
        cy.get('[data-cy="popinFixed"].html-document').should('be.visible')
      })
    })
  })
})
