import { PAGES } from '../../support/urls_commands'

const noteTitle = 'TitleNote'
let noteId
const threadTitle = 'TitleThread'
let threadId

let workspaceId
let commentText

const commentAreaInput = '.timeline__texteditor__textinput #wysiwygTimelineComment'

describe('In a comment', () => {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createHtmlDocument(noteTitle, workspaceId).then(note => {
        noteId = note.content_id
        commentText = `This is a comment #${noteId} that has a link`
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
      .type(commentText)
    cy.contains(commentAreaInput, commentText)
    cy.get('.timeline__texteditor__submit__btn')
      .click()
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe('send a comment with a link', () => {
    it('should have the text and the a tag with the id', () => {
      cy.contains('.comment__body__content__text', commentText)
      cy.contains('.comment__body__content__text a', noteId)
    })

    it('should redirect to content if clicked', () => {
      cy.get('.comment__body__content__text a')
        .click()
      cy.url().should('include', noteId)
    })
  })
})
