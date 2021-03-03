import { PAGES } from '../../support/urls_commands'

const threadTitle = 'Thread'
const fileTitle = 'File'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'
let threadId
let fileId
let workspaceId

describe("An app's name", () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId).then(file => fileId = file.content_id)
      cy.createThread(threadTitle, workspaceId).then(thread => threadId = thread.content_id)
    })
  })

  beforeEach(function () {
    cy.loginAs('administrators')
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it('should show the file extension with content type is a file', () => {
    cy.visitPage({
      pageName: PAGES.CONTENT_OPEN,
      params: { workspaceId: workspaceId, contentType: 'file', contentId: fileId }
    })
    cy.get('.newVersionBtn').click()
    cy.dropFixtureInDropZone(fullFilename, contentType, '.filecontent__form', fullFilename)
    cy.get('.file__contentpage__dropzone__btn__validate').click()
    cy.contains('.FilenameWithExtension .badge', '.png')
  })

  it('should not show the file extension with content type is not a file', () => {
    cy.visitPage({
      pageName: PAGES.CONTENT_OPEN,
      params: { workspaceId: workspaceId, contentType: 'thread', contentId: threadId }
    })
    cy.get('.FilenameWithExtension').should('not.exist')
  })
})
