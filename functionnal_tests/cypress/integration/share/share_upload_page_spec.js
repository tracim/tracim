import { PAGES } from '../../support/urls_commands'

const fileTitle = 'FileForSearch'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'

const emptyPhrase = 'No upload link has been created yet'

let workspaceId

describe('Open the share folder advanced', () => {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId)
    }).then(() => {
      cy.visitPage({ pageName: PAGES.CONTENTS, params: { workspaceId: workspaceId } })
      cy.get('.folder__header__button').should('be.visible').click()
      cy.get('.dropdownMenuItem .fa-pencil-alt').first().should('be.visible').click()
    })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  it('Should redirect to share page', () => {
    cy.get('.share_folder_advanced__content').contains('Public upload links').should('be.visible')
  })

  it('Should have a "no uploads" message', () => {
    cy.get('.share_folder_advanced__content__empty').contains(emptyPhrase).should('be.visible')
  })

  describe('and clicking on the New button', () => {
    beforeEach(function () {
      cy.get('[data-cy=share_folder_advanced__content__btnupload]').should('be.visible').click()
    })
    it('Should redirect to new share page', () => {
      cy.get('.newUpload').contains('New public upload link').should('be.visible')
    })

    it('Clicking on the Cancel button, hould redirect to share page', () => {
      cy.get('.newUpload__btnCancel').should('be.visible').click()
      cy.get('.share_folder_advanced__content').contains('Public upload links').should('be.visible')
    })

    it('clicking on delete, should delete the share link', () => {
      // INFO - B.L - 2019.09-13 Adds wait to be sure formatting on the input is loaded otherwise it randomly breaks "type"
      cy.wait(1000)
      cy.get('.newUpload__email__input').should('be.visible').type('email@email.email')
      cy.get('.newUpload__newBtn').should('be.visible').click()
      cy.get('[data-cy=deleteShareLink]').should('be.visible').click()
      cy.get('.share_folder_advanced__content__empty').contains(emptyPhrase).should('be.visible')
      cy.get('[data-cy=flashmessage]').contains('Public upload link has been created.')
    })
  })
})
