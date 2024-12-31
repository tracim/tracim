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

  it('should close sidebar on fullscreen', () => {
    cy.get('.sidebar').should('be.visible')
    cy.get('.sidebarClose').should('not.exist')
    cy.get(fullscreenButtonSelector).should('be.visible').click()
    cy.get('.sidebar').should('be.visible')
    cy.get('.sidebarClose').should('be.visible')
  })
})
