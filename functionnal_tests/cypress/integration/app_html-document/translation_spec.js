import { PAGES } from '../../support/urls_commands.js'

describe('App HTML Document', function () {
  let noteId
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.createHtmlDocument('note', workspace.workspace_id).then(note => {
        noteId = note.content_id
        cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: noteId } })
      })
    })
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it('should have translations', () => {
    cy.contains('[data-cy="newVersionButton"]', 'Edit')

    cy.changeLanguage('fr')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: noteId } })
    cy.contains('[data-cy="newVersionButton"]', 'Modifier')

    cy.changeLanguage('pt')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: noteId } })
    cy.contains('[data-cy="newVersionButton"]', 'Editar')

    cy.changeLanguage('de')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: noteId } })
    cy.contains('[data-cy="newVersionButton"]', 'Bearbeiten')
  })
})
