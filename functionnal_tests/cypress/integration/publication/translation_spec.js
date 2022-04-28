import { PAGES } from '../../support/urls_commands'

const publishButton = '.commentArea__submit__btn'
const text = 'Hello, world'
let workspaceId

describe('Publications page', () => {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then((workspace) => {
      workspaceId = workspace.workspace_id
      cy.visitPage({ pageName: PAGES.PUBLICATION, params: { workspaceId }, waitForTlm: true })
      cy.get('#wysiwygTimelineCommentPublication').type(text)
      cy.contains(publishButton, 'Publish').click()
    })
  })

  it('should have translations', () => {
    cy.changeLanguage('en')
    cy.visitPage({ pageName: PAGES.PUBLICATION, params: { workspaceId }, waitForTlm: true })
    cy.contains(publishButton, 'Publish')

    cy.changeLanguage('fr')
    cy.visitPage({ pageName: PAGES.PUBLICATION, params: { workspaceId }, waitForTlm: true })
    cy.contains(publishButton, 'Publier')

    cy.changeLanguage('pt')
    cy.visitPage({ pageName: PAGES.PUBLICATION, params: { workspaceId }, waitForTlm: true })
    cy.contains(publishButton, 'Publicar')

    cy.changeLanguage('de')
    cy.visitPage({ pageName: PAGES.PUBLICATION, params: { workspaceId }, waitForTlm: true })
    cy.contains(publishButton, 'Publizieren')
  })
})
