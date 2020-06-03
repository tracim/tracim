import { PAGES } from '../../support/urls_commands'
import { SELECTORS as s, formatTag } from '../../support/generic_selector_commands'

let workspaceId

const htmlDocTitle = 'HtmlDoc'
const veryLongComment = 'this_is_a_very_long_comment lorem_ipsum_dolor_sit_amet_consectetur_adipiscing_elit_Nunc_sem_quam_imperdiet_sed_eros_in, finibus facilisis nibh. Cras vulputate, neque quis hendrerit lacinia, neque libero accumsan mauris, vitae venenatis lacus orci et justo.'

const contentHtmlDocGetter = formatTag({selectorName: s.CONTENT_IN_SEARCH, attrs: {title: htmlDocTitle}})

const commentArea = '.comment__body'
const commentText = '.comment__body__text'
const cancelDocBtn = '.html-document__editionmode__cancel'
const submitBtn = '.timeline__texteditor__submit__btn'
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
    cy.visitPage({pageName: PAGES.CONTENTS, params: {workspaceId: workspaceId}})
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it('Should not change the comment area size', function () {
    // TODO - GM - 2020/06/03 - Add this test when Html document app support TLM
    // https://github.com/tracim/tracim/issues/3066
    this.skip()
    cy.get(contentHtmlDocGetter).click()
    cy.get(cancelDocBtn).click()

    cy.get(commentField).type(veryLongComment)
    cy.get(submitBtn).click()

    cy.get(commentText).invoke('css', 'width').then(largeCommentSize => {
      cy.get(commentArea).invoke('css', 'width').should('be.gt', largeCommentSize)
    })
  })
})
