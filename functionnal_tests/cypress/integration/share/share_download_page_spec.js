import { PAGES } from '../../support/urls_commands'

const fileTitle = 'FileForSearch'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'

const fileShareTiltle = 'File share'
const newShareTiltle = 'New share'
const emptyPhrase = 'No share link has been created yet'

let workspaceId
let contentId

describe('Open a file', () => {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId)
        .then(newContent => {
          contentId = newContent.content_id
        })
    }).then(data => {
      cy.visitPage({
        pageName: PAGES.CONTENT_OPEN,
        params: { workspaceId: workspaceId, contentType: 'file', contentId: contentId }
      })
      cy.get('.wsContentGeneric__content__right__header .fa-share-alt').should('be.visible').click()
    })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('and clicking on the share icon', () => {
    it('Should redirect to new share page at the right part if file shares list is empty', () => {
      cy.contains('.shareDownload__title', newShareTiltle).should('be.visible')
    })

    describe('and clicking on the Cancel button', () => {
      it('Should redirect to share page at the right part', () => {
        cy.get('.shareDownload__buttons__cancel').should('be.visible').click()
        cy.get('.shareDownload__management__header').should('be.visible')
      })

      it('Should have the "no share link" message', () => {
        cy.get('.shareDownload__buttons__cancel').should('be.visible').click()
        cy.contains('.shareDownload', emptyPhrase).should('be.visible')
      })
    })

    describe('and creating a share link', () => {
      describe('and clicking to delete share link', () => {
        it('Should delete the share link', () => {
          // INFO - B.L - 2019.09-13 Adds wait to be sure formatting on the input is loaded otherwise it randomly breaks "type"
          cy.wait(1000)
          cy.get('.shareDownload__email__input').type('email@email.email')
          cy.get('.shareDownload__buttons__newBtn').should('be.visible').click()
          cy.get('[data-cy=deleteShareLink]').should('be.visible').click()
          cy.contains('.shareDownload', emptyPhrase).should('be.visible')
        })

        describe('and clicking on the New button', () => {
          it('Should redirect to new share page at the right part', () => {
            cy.wait(1000)
            // INFO - B.L - 2019.09-13 Adds wait to be sure formatting on the input is loaded otherwise it randomly breaks "type"
            cy.get('.shareDownload__email__input').type('email@email.email')
            cy.get('.shareDownload__buttons__newBtn').should('be.visible').click()
            cy.get('.shareDownload__btn').should('be.visible').click()
            cy.contains('.file__contentpage__content__right', 'New share').should('be.visible')
          })
        })
      })
    })
  })
})
