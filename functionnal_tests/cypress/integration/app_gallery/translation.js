import { PAGES } from '../../support/urls_commands'

describe('App Gallery', function () {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.visitPage({ pageName: PAGES.GALLERY, params: { workspaceId: workspace.workspace_id } })
    })
  })

  it('should have translations', () => {
    cy.get('.gallery__action__button').contains('Play')
    cy.changeLanguage('fr')
    cy.get('.gallery__action__button').contains('Lecture')
    cy.changeLanguage('pt')
    cy.get('.gallery__action__button').contains('Reproduzir')
    cy.changeLanguage('de')
    cy.get('.gallery__action__button').contains('Abspielen')
  })
})
