import {create_file} from '../helpers/file.js'
import {create_htmldocument} from '../helpers/htmldoc.js'

describe('Switch from app Htmldoc to app File', () => {
  const htmlDocTitle = 'HtmlDocForSwitch'
  const fileTitle = 'FileForSwitch'
  const contentHtmlDocGetter = `.workspace__content__fileandfolder > .content[title="${htmlDocTitle}"]`
  const contentFileGetter = `.workspace__content__fileandfolder > .content[title="${fileTitle}"]`
  let workspaceId

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.visit(`/ui/workspaces/${workspaceId}/contents`)

      create_file(cy, fileTitle)
      cy.get('[data-cy="popinFixed__header__button__close"]').should('be.visible').click()

      create_htmldocument(cy, htmlDocTitle)
      cy.get('[data-cy="popinFixed__header__button__close"]').should('be.visible').click()
    })
  })

  it('should close the app Htmldoc and open the app File', () => {
    cy.visit(`/ui/workspaces/${workspaceId}/contents`, {retryOnStatusCodeFailure: true})

    cy.get(contentHtmlDocGetter).click('left')
    cy.waitForTinyMCELoaded().then(() => {
      cy.get(contentFileGetter).click('left')

      cy.get('[data-cy="popinFixed"].html-document').should('be.not.visible')
      cy.get('[data-cy="popinFixed"].file').should('be.visible')
    })
  })
})
