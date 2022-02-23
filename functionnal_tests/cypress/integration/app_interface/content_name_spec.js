import { PAGES } from '../../support/urls_commands'

const threadTitle = 'Thread'
const fileTitle = 'File'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'
let threadId
let fileId
let workspaceId

describe("A content's name inside an app", () => {
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

  it('should show the extension if content type is a file', () => {
    cy.visitPage({
      pageName: PAGES.CONTENT_OPEN,
      params: { contentId: fileId }
    })
    cy.contains('[data-cy=FilenameWithExtension__label]', fileTitle).should('be.visible')
    cy.get('[data-cy="dropdownContentButton"]').should('be.visible').click()
    cy.get('[data-cy="newVersionBtn"]').click()
    cy.dropFixtureInDropZone(fullFilename, contentType, '.filecontent__form', fullFilename)
    cy.get('.file__contentpage__dropzone__btn__validate').click()
    cy.contains('.FilenameWithExtension .badge', '.png')
  })

  it('should not show the extension if content type is not a file', () => {
    cy.visitPage({
      pageName: PAGES.CONTENT_OPEN,
      params: { contentId: threadId }
    })
    cy.get('.FilenameWithExtension').should('not.exist')
  })
})

