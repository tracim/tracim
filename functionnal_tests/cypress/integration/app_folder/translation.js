import { PAGES } from '../../support/urls_commands.js'
import { SELECTORS as s } from '../../support/generic_selector_commands.js'

describe('App Folder Advanced', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.visitPage({ pageName: PAGES.CONTENTS, params: { workspaceId: workspace.workspace_id } })
      cy.createFolder('test', workspace.workspace_id).then(f => {
        cy.getTag({ selectorName: s.FOLDER_IN_LIST, params: { folderId: f.content_id } })
          .find('[data-cy="extended_action"]')
          .click()

        cy.getTag({ selectorName: s.FOLDER_IN_LIST, params: { folderId: f.content_id } })
          .find('[data-cy="extended_action_edit"]')
          .click()
      })
    })
  })

  it('should have translations', () => {
    cy.get('.folder_advanced__content__title').contains('Allowed content type for this folder')

    cy.changeLanguage('fr')
    cy.get('.folder_advanced__content__title').contains('Types de contenus autorisés pour ce dossier')

    cy.changeLanguage('pt')
    cy.get('.folder_advanced__content__title').contains('Tipo de conteúdo permitido para esta pasta')

    cy.changeLanguage('de')
    cy.get('.folder_advanced__content__title').contains('Erlaubte Inhaltsarten für diesen Ordner')
  })
})
