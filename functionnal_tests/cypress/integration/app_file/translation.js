import { PAGES } from '../../support/urls_commands.js'

describe('App File', () => {
  before(function () {
    const fileTitle_1 = 'file-1'
    const fullFilename_1 = 'Linux-Free-PNG.png'
    const contentType = 'image/png'
    let firstContentId

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
    cy.get('[data-cy="dropdownContentButton"]').click()
    cy.get('[data-cy="newVersionBtn"]').contains('Upload a new version')

    cy.changeLanguage('fr')
    cy.get('[data-cy="dropdownContentButton"]').click()
    cy.get('[data-cy="newVersionBtn"]').contains('Téléverser une nouvelle version')

    cy.changeLanguage('pt')
    cy.get('[data-cy="dropdownContentButton"]').click()
    cy.get('[data-cy="newVersionBtn"]').contains('Carregar uma nova versão')

    cy.changeLanguage('de')
    cy.get('[data-cy="dropdownContentButton"]').click()
    cy.get('[data-cy="newVersionBtn"]').contains('Hochladen einer neuen Version')
  })
})
