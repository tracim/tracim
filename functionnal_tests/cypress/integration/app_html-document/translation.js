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

  it('should have translations', () => {
    cy.get('[data-cy="dropdownContentButton"]').click()
    cy.get('[data-cy="popinListItem__newVersion"]').contains('Edit')

    cy.changeLanguage('fr')
    cy.get('[data-cy="dropdownContentButton"]').click()
    cy.get('[data-cy="popinListItem__newVersion"]').contains('Modifier')

    cy.changeLanguage('pt')
    cy.get('[data-cy="dropdownContentButton"]').click()
    cy.get('[data-cy="popinListItem__newVersion"]').contains('Editar')

    cy.changeLanguage('de')
    cy.get('[data-cy="dropdownContentButton"]').click()
    cy.get('[data-cy="popinListItem__newVersion"]').contains('Bearbeiten')
  })
})
