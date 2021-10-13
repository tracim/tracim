import { PAGES } from '../../support/urls_commands'
import { SELECTORS as s, formatTag } from '../../support/generic_selector_commands'

let workspaceId

const htmlDocTitle = 'HtmlDoc'
const veryLongComment = 'this_is_a_very_long_comment lorem_ipsum_dolor_sit_amet_consectetur_adipiscing_elit_Nunc_sem_quam_imperdiet_sed_eros_in, finibus facilisis nibh. Cras vulputate, neque quis hendrerit lacinia, neque libero accumsan mauris, vitae venenatis lacus orci et justo.'

const contentHtmlDocGetter = formatTag({ selectorName: s.CONTENT_IN_SEARCH, attrs: { title: htmlDocTitle } })

const commentArea = '.comment__body'
const commentText = '.comment__body__content__text'
const cancelDocBtn = '.html-document__editionmode__cancel'
const submitBtn = '.commentArea__submit__btn'
const commentField = '#wysiwygTimelineComment'

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
    cy.get(cancelDocBtn).click()

    cy.createComment(workspaceId, 1, [
      '<p data-cy="comment-first-paragraph">Hello1</p>',
      '<p data-cy="comment-middle-paragraph">Between</p>',
      '<p data-cy="comment-last-paragraph">Hello2</p>'
    ].join(''))

    cy.get('[data-cy=comment-first-paragraph]').invoke('css', 'marginTop').should('be.equal', '0px')
    cy.get('[data-cy=comment-first-paragraph]').invoke('css', 'paddingTop').should('be.equal', '0px')
    cy.get('[data-cy=comment-last-paragraph]').invoke('css', 'marginBottom').should('be.equal', '0px')
    cy.get('[data-cy=comment-last-paragraph]').invoke('css', 'paddingBottom').should('be.equal', '0px')

    cy.get('[data-cy=comment-first-paragraph]').invoke('css', 'marginBottom').should('not.be.equal', '0px')
    cy.get('[data-cy=comment-middle-paragraph]').invoke('css', 'marginBottom').should('not.be.equal', '0px')
  })

  it('Should not change the comment area size', function () {
    cy.get(contentHtmlDocGetter).click()
    cy.get(cancelDocBtn).click()

    cy.get(commentField).type(veryLongComment)
    cy.get(submitBtn).click()

    cy.get(commentText).invoke('css', 'width').then(largeCommentSize => {
      cy.get(commentArea).invoke('css', 'width').should('be.gt', largeCommentSize)
    })
  })
})
