import { PAGES } from '../../support/urls_commands'

const noteTitle = 'TitleNote'
let noteId
const threadTitle = 'TitleThread'
let threadId

let workspaceId
let commentInputText
let commentDisplayedText

const commentAreaInput = '.commentArea__textinput #wysiwygTimelineComment'

describe('In a comment', () => {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createHtmlDocument(noteTitle, workspaceId).then(note => {
        noteId = note.content_id
        commentInputText = `This is a comment #${noteId} that has a link`
        commentDisplayedText = `This is a comment ${noteTitle} that has a link`
      })
      cy.createThread(threadTitle, workspaceId).then(thread => {
        threadId = thread.content_id
      })
    })
  })

  beforeEach(() => {
    cy.loginAs('administrators')
    cy.visitPage({
      pageName: PAGES.CONTENT_OPEN,
      params: { workspaceId: workspaceId, contentType: 'thread', contentId: threadId }
    })
    cy.get(commentAreaInput)
      .should('be.visible')
      .type(commentInputText)
    cy.contains(commentAreaInput, commentInputText)
    cy.get('.commentArea__submit__btn')
      .click()
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe('send a comment with a link', () => {
    it('should have the text and the a tag with the title', () => {
      cy.contains('.comment__body__content__text', commentDisplayedText)
      cy.contains('.comment__body__content__text a', noteTitle)
    })

    it('should redirect to content if clicked', () => {
      cy.get('.comment__body__content__text a')
        .click()
      cy.url().should('include', noteId)
    })
  })
})
