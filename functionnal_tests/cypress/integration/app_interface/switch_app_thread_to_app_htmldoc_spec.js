import {create_thread} from '../helpers/thread.js'
import {create_htmldocument} from '../helpers/htmldoc.js'

describe('Switch from app Thread to app Htmldoc', () => {
  const htmlDocTitle = 'HtmlDocForSwitch'
  const threadTitle = 'ThreadForSwitch'
  const contentHtmlDocGetter = `.workspace__content__fileandfolder > .content[title="${htmlDocTitle}"]`
  const contentThreadGetter = `.workspace__content__fileandfolder > .content[title="${threadTitle}"]`
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

      create_thread(cy, threadTitle)
      cy.get('[data-cy="popinFixed__header__button__close"]').should('be.visible').click()
    })
  })

  it('should close the app Thread and open the app Htmldoc', () => {
    cy.visit(`/ui/workspaces/${workspaceId}/contents`, {retryOnStatusCodeFailure: true})

    cy.get(contentThreadGetter).click('left')
    cy.get(contentHtmlDocGetter).click('left')
    cy.waitForTinyMCELoaded().then(() => {
      cy.get('[data-cy="popinFixed"].thread').should('be.not.visible')
      cy.get('[data-cy="popinFixed"].html-document').should('be.visible')
    })
  })
})
