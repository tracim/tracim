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

  it('Should have a "no uploads" message', () => {
    cy.get('.share_folder_advanced__content__empty').contains('No upload link has been created yet.').should('be.visible')
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

    describe('and creating a share link',() => {
      describe('and clicking to delete share link',() => {
        it('Should delete the share link',() => {
          cy.get('.share_folder_advanced__content__btnupload').click()
          cy.get('.newUpload__email__input').type('email@email.email')
          cy.get('.newUpload__btnNew').click()
          cy.get('[data-cy=deleteShareLink]').click()
          cy.get('.share_folder_advanced__content__empty').contains('No upload link has been created yet.').should('be.visible')
        })
      })
    })
  })
})
