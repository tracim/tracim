import { PAGES } from '../../support/urls_commands'

describe.skip('Create to dos', () => {
  const fileTitle = 'FileForTags'
  const fullFilename = 'Linux-Free-PNG.png'
  const contentType = 'image/png'

  describe('in a content', () => {
    beforeEach(() => {
      cy.resetDB()
      cy.setupBaseDB()

      cy.loginAs('administrators')

      cy.fixture('baseWorkspace').as('workspace').then(workspace => {
        workspaceId = workspace.workspace_id
        cy.createFile(fullFilename, contentType, fileTitle, workspaceId).then(content => {
          fileId = content.content_id
        })
      })
    })
  })
})
