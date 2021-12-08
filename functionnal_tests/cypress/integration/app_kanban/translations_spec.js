import { PAGES } from '../../support/urls_commands'

describe('App Kanban', () => {
  const fullscreenButtonSelector = '.kanban__contentpage__statewrapper__kanban__toolbar .iconbutton__text_with_icon'
  const fullFilename = 'Linux-Free-PNG.png'
  const contentType = 'image/png'
  const kanbantitle = 'Kanban'
  let workspaceId

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')

    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createKanban(fullFilename, contentType, kanbantitle, workspaceId).then(content => {
        cy.visitPage({
          pageName: PAGES.CONTENT_OPEN,
          params: { workspaceId: workspaceId, contentType: 'kanban', contentId: content.content_id }
        })
      })
    })
  })

  it('should have translations', () => {
    cy.changeLanguage('en')
    cy.contains(fullscreenButtonSelector, 'Fullscreen')

    cy.changeLanguage('fr')
    cy.contains(fullscreenButtonSelector, 'Plein écran')

    cy.changeLanguage('pt')
    cy.contains(fullscreenButtonSelector, 'Ecrã inteiro')

    cy.changeLanguage('de')
    cy.contains(fullscreenButtonSelector, 'Vollbild')
  })
})
