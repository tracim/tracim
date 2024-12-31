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

describe('A comment in TinyMCE', () => {
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
      params: { contentId: threadId }
    })
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe(`type ${linkChar}`, () => {
    it('should display the auto completer with data', () => {
      cy.inputInTinyMCE(`${linkChar}ti`)
      // Display the auto completer
      cy.get('.tox-autocompleter')
        .should('be.visible')
      // Items are correctly displayed
      cy.contains('.tox-collection__item', noteId)
        .should('be.visible')
      cy.contains('.tox-collection__item', noteTitle)
        .should('be.visible')
      // Display the 3 expected items
      cy.get('.tox-collection__item').should('have.length', 3)
      // Click on the first item
      cy.contains('.tox-collection__item', fileTitle)
        .click()
      cy.assertTinyMCEContent(`${linkChar}${fileId}`)
    })
  })
})
