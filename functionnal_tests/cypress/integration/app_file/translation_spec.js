import { PAGES } from '../../support/urls_commands.js'

describe('App File', () => {
  let fileId

  before(function () {
    const fileTitle_1 = 'file-1'
    const fullFilename_1 = 'Linux-Free-PNG.png'
    const contentType = 'image/png'

    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')

    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      const workspaceId = workspace.workspace_id
      cy.createFile(fullFilename_1, contentType, fileTitle_1, workspace.workspace_id)
        .then(newContent => {
          fileId = newContent.content_id
          cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: fileId }})
        })
    })
  })

  it('should have translations', () => {
    cy.changeLanguage('en')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: fileId }})
    cy.get('.FilenameWithExtension').should('be.visible')
    cy.contains('.wsContentGeneric__content__right__content__title', 'Timeline')

    cy.changeLanguage('fr')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: fileId }})
    cy.get('.FilenameWithExtension').should('be.visible')
    cy.contains('.wsContentGeneric__content__right__content__title', 'Historique')

    cy.changeLanguage('pt')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: fileId }})
    cy.get('.FilenameWithExtension').should('be.visible')
    cy.contains('.wsContentGeneric__content__right__content__title', 'Linha cronológica')

    cy.changeLanguage('de')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: fileId }})
    cy.get('.FilenameWithExtension').should('be.visible')
    cy.contains('.wsContentGeneric__content__right__content__title', 'Zeitleiste')
  })
})
