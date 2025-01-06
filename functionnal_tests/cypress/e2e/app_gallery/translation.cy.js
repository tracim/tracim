import { PAGES } from '../../support/urls_commands'

describe('App Gallery', function () {
  let workspaceId
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.visitPage({ pageName: PAGES.GALLERY, params: { workspaceId: workspace.workspace_id } })
    })
  })

  it('should have translations', () => {
    cy.get('.gallery__action__button').contains('Play')

    cy.changeLanguageFromApiForAdminUser('fr')
    cy.visitPage({ pageName: PAGES.GALLERY, params: { workspaceId } })
    cy.get('.gallery__action__button').contains('Lecture')

    cy.changeLanguageFromApiForAdminUser('pt')
    cy.visitPage({ pageName: PAGES.GALLERY, params: { workspaceId } })
    cy.get('.gallery__action__button').contains('Reproduzir')

    cy.changeLanguageFromApiForAdminUser('de')
    cy.visitPage({ pageName: PAGES.GALLERY, params: { workspaceId } })
    cy.get('.gallery__action__button').contains('Abspielen')

    cy.changeLanguageFromApiForAdminUser('ar')
    cy.visitPage({ pageName: PAGES.GALLERY, params: { workspaceId } })
    cy.get('.gallery__action__button').contains('تشغيل')

    cy.changeLanguageFromApiForAdminUser('es')
    cy.visitPage({ pageName: PAGES.GALLERY, params: { workspaceId } })
    cy.get('.gallery__action__button').contains('Jugar')
  })
})
