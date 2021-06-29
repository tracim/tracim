import { PAGES } from '../../support/urls_commands.js'

describe('App File', () => {
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
          cy.visitPage({
            pageName: PAGES.CONTENT_OPEN,
            params: { workspaceId: workspaceId, contentType: 'file', contentId: newContent.content_id }
          })
        })
    })
  })

  it('should have translations', () => {
    cy.changeLanguage('en')
    cy.get('.FilenameWithExtension').should('be.visible')
    cy.get('.timeline__title').contains('Timeline')

    cy.changeLanguage('fr')
    cy.get('.FilenameWithExtension').should('be.visible')
    cy.get('.timeline__title').contains('Historique')

    cy.changeLanguage('pt')
    cy.get('.FilenameWithExtension').should('be.visible')
    cy.get('.timeline__title').contains('Linha cronológica')

    cy.changeLanguage('de')
    cy.get('.FilenameWithExtension').should('be.visible')
    cy.get('.timeline__title').contains('Zeitleiste')
  })
})
