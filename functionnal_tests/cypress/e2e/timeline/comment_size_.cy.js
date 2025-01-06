import { PAGES } from '../../support/urls_commands'
import { SELECTORS as s, formatTag } from '../../support/generic_selector_commands'

let workspaceId

const htmlDocTitle = 'HtmlDoc'
const veryLongComment = 'this_is_a_very_long_comment lorem_ipsum_dolor_sit_amet_consectetur_adipiscing_elit_Nunc_sem_quam_imperdiet_sed_eros_in, finibus facilisis nibh. Cras vulputate, neque quis hendrerit lacinia, neque libero accumsan mauris, vitae venenatis lacus orci et justo.'

const contentHtmlDocGetter = formatTag({ selectorName: s.CONTENT_IN_SEARCH, attrs: { title: htmlDocTitle } })

describe('Add a new comment', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createHtmlDocument(htmlDocTitle, workspaceId)
    })
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.CONTENTS, params: { workspaceId: workspaceId } })
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it('Should apply margin between paragraphs', function () {
    cy.get(contentHtmlDocGetter).click()
    cy.get('.html-document__editionmode__cancel').click()

    cy.createComment(workspaceId, 1, [
      '<p data-cy="timeline__comment-first-paragraph">Hello1</p>',
      '<p data-cy="timeline__comment-middle-paragraph">Between</p>',
      '<p data-cy="timeline__comment-last-paragraph">Hello2</p>'
    ].join(''))

    cy.get('[data-cy=timeline__comment-first-paragraph]').should('have.css', 'marginTop', '0px')
    cy.get('[data-cy=timeline__comment-first-paragraph]').should('have.css', 'paddingTop', '0px')
    cy.get('[data-cy=timeline__comment-last-paragraph]').should('have.css', 'marginBottom', '0px')
    cy.get('[data-cy=timeline__comment-last-paragraph]').should('have.css', 'paddingBottom', '0px')

    cy.get('[data-cy=timeline__comment-first-paragraph]').should('not.have.css', 'marginBottom', '0px')
    cy.get('[data-cy=timeline__comment-middle-paragraph]').should('not.have.css', 'marginBottom', '0px')
  })
})
