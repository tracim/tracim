import { PAGES } from '../../support/urls_commands'

const fileTitle = 'FileForSearch'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'

let workspaceId

describe('Open the share folder advanced', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId)
    })
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visitPage({pageName: PAGES.SHARE_FOLDER, params: {workspaceId: workspaceId}})
  })


  it('Should redirect to share page', () => {
    cy.get('.share_folder_advanced__content').contains('Import authorizations').should('be.visible')
  })

  describe('and clicking on the New button',() => {
    it('Should redirect to new share page',() => {
      cy.get('.share_folder_advanced__content__btnupload').click()
      cy.get('.newUpload').contains('New authorization').should('be.visible')
    })

    describe('and clicking on the Cancel button',() => {
      it('Should redirect to share page',() => {
        cy.get('.share_folder_advanced__content__btnupload').click()
        cy.get('.newUpload__btnCancel').click()
        cy.get('.share_folder_advanced__content').contains('Import authorizations').should('be.visible')
      })
    })
  })
})
