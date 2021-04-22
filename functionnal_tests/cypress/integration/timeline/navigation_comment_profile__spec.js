import { PAGES } from '../../support/urls_commands'
import { SELECTORS as s, formatTag } from '../../support/generic_selector_commands'

let workspaceId
let contentId
const htmlDocTitle = 'HtmlDoc'
const comment = 'just a comment'

const contentHtmlDocGetter = formatTag({ selectorName: s.CONTENT_IN_SEARCH, attrs: { title: htmlDocTitle } })

describe('A comment', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createHtmlDocument(htmlDocTitle, workspaceId).then(content => {
          contentId = content.content_id
          cy.createComment(workspaceId, contentId, comment)
      })
    })
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visitPage({ pageName: PAGES.CONTENTS, params: { workspaceId: workspaceId } })
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it(`should redirect to author's profile when click in they public name`, function () {
    cy.get(contentHtmlDocGetter).click()
    cy.get('.html-document__editionmode__cancel').click()
    cy.get('.comment__body__content__header__meta__author').click()
    cy.get('.profile__mainBar__info__user').should('be.visible')
  })
})
