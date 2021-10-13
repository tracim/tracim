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

describe.skip('A comment in advanced edition', () => {
  // RJ - FIXME - 2021-06-10 - unstable test disabled, see https://github.com/tracim/tracim/issues/3986
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
    cy.get('.commentArea__advancedtext__btn')
      .should('be.visible')
      .click()
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe(`type ${linkChar}`, () => {
    it('should show autocomplete', () => {
      cy.inputInTinyMCE(linkChar)
      cy.get('.autocomplete')
        .should('be.visible')
    })

    it('should contain the id and the title in an autocomplete item', () => {
      cy.inputInTinyMCE(linkChar)
      cy.contains('.autocomplete__item', noteId)
        .should('be.visible')
      cy.contains('.autocomplete__item', noteTitle)
        .should('be.visible')
    })

    it('should contain all created contents in autocomplete', () => {
      cy.inputInTinyMCE(linkChar)
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
      cy.inputInTinyMCE(linkChar)
      cy.contains('.autocomplete__item', fileTitle)
        .click()
      cy.assertTinyMCEContent(`${linkChar}${fileId}`)
    })
  })
})
