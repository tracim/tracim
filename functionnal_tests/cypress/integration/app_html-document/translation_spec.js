import { PAGES } from '../../support/urls_commands.js'

describe('App HTML Document', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.visitPage({
        pageName: PAGES.CONTENTS,
        getters: { type: 'html-document' },
        params: { workspaceId: workspace.workspace_id }
      })
    })
    cy.get('[data-cy=dropdownCreateBtn]').should('be.visible').click()
    cy.get('.show .fa-file-alt').should('be.visible').click()
    cy.get('.createcontent__form__input').type('test')
    cy.get('[data-cy="popup__createcontent__form__button"]').click()
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it('should have translations', () => {
    cy.contains('[data-cy="newVersionButton"]', 'Edit')

    cy.changeLanguage('fr')
    cy.contains('[data-cy="newVersionButton"]', 'Modifier')

    cy.changeLanguage('pt')
    cy.contains('[data-cy="newVersionButton"]', 'Editar')

    cy.changeLanguage('de')
    cy.contains('[data-cy="newVersionButton"]', 'Bearbeiten')
  })
})
