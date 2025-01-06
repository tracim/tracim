import { PAGES } from '../../support/urls_commands'

describe('App Kanban', () => {
  const fullscreenButtonSelector = '.headerBtn'
  const fullFilename = 'Linux-Free-PNG.png'
  const contentType = 'image/png'
  const kanbantitle = 'Kanban'
  let kanbanId
  let workspaceId

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')

    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createKanban(fullFilename, contentType, kanbantitle, workspaceId).then(content => {
        kanbanId = content.content_id
        cy.visitPage({
          pageName: PAGES.CONTENT_OPEN,
          params: { contentId: kanbanId }
        })
      })
    })
  })

  it('should have translations', () => {
    cy.changeLanguageFromApiForAdminUser('en')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: kanbanId } })
    cy.contains(fullscreenButtonSelector, 'Fullscreen')

    cy.changeLanguageFromApiForAdminUser('fr')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: kanbanId } })
    cy.contains(fullscreenButtonSelector, 'Plein écran')

    cy.changeLanguageFromApiForAdminUser('pt')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: kanbanId } })
    cy.contains(fullscreenButtonSelector, 'Ecrã inteiro')

    cy.changeLanguageFromApiForAdminUser('de')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: kanbanId } })
    cy.contains(fullscreenButtonSelector, 'Vollbild')

    cy.changeLanguageFromApiForAdminUser('ar')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: kanbanId } })
    cy.contains(fullscreenButtonSelector, 'ملء الشاشة')

    cy.changeLanguageFromApiForAdminUser('es')
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: kanbanId } })
    cy.contains(fullscreenButtonSelector, 'Pantalla completa')
  })
})
