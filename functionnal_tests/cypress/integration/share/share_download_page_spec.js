import { PAGES } from '../../support/urls_commands'

const fileTitle = 'FileForSearch'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'



let workspaceId

describe('Open a file', () => {
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
    cy.visitPage({pageName: PAGES.CONTENTS, params: {workspaceId: workspaceId}})
    cy.get('.content').click()
    cy.get('.wsContentGeneric__content__right__header .fa-share-alt').click()
  })


  describe('and clicking on the share icon', () => {
    it('Should redirect to share page at the right part', () => {
      cy.get('.file__contentpage__content__right').contains('File share').should('be.visible')
    })

    describe('and clicking on the New button',() =>{
      it('Should redirect to new share page at the right part',() => {
        cy.get('.shareDownload__btn').click()
        cy.get('.file__contentpage__content__right').contains('New share').should('be.visible')
      })
    })
  })
})
