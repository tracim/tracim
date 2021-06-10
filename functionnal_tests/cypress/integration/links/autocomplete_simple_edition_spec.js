import { PAGES } from '../../support/urls_commands'

const noteTitle = 'TitleNote'
let noteId
const threadTitle = 'TitleThread'
let threadId
const fileTitle = 'TitleFile'
const fullFilename = 'Linux-Free-PNG.png'
const fileType = 'image/png'
let fileId

let workspaceId

const linkChar = '#'
const commentAreaInput = '.timeline__texteditor__textinput #wysiwygTimelineComment'

describe('A comment in simple edition', () => {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename, fileType, fileTitle, workspaceId).then(file => {
        fileId = file.content_id
      })
      cy.createHtmlDocument(noteTitle, workspaceId).then(note => {
        noteId = note.content_id
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
      .type(linkChar)
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe(`type ${linkChar}`, () => {
    it('should show autocomplete', () => {
      cy.get('.autocomplete')
        .should('be.visible')
    })

    it('should contain the id and the title in an autocomplete item', () => {
      cy.contains('.autocomplete__item', noteId)
        .should('be.visible')
      cy.contains('.autocomplete__item', noteTitle)
        .should('be.visible')
    })

    it('should contain all created contents in autocomplete', () => {
      cy.contains('.autocomplete__item', fileId)
        .should('be.visible')
      cy.contains('.autocomplete__item', noteId)
        .should('be.visible')
      cy.contains('.autocomplete__item', threadId)
        .should('be.visible')
    })
  })

  describe('click on an item of autocomplete popup', () => {
    it('should complete the comment with content id', () => {
      cy.contains('.autocomplete__item', fileTitle)
        .click()
      cy.contains(commentAreaInput, `${linkChar}${fileId}`)
    })
  })
})
