import { PAGES } from '../../support/urls_commands'

const publishButton = '.publications__publishArea__buttons__submit'
const text = 'Hello, world'

describe('Publications page', () => {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then((workspace) => {
      cy.visitPage({
        pageName: PAGES.PUBLICATION,
        params: { workspaceId: workspace.workspace_id },
        waitForTlm: true
      })
      cy.get('#wysiwygTimelineCommentPublication').type(text)
      cy.contains(publishButton, 'Publish').click()
    })
  })

  it('should have translations', () => {
    cy.changeLanguage('en')
    cy.contains(publishButton, 'Publish')

    cy.changeLanguage('fr')
    cy.contains(publishButton, 'Publier')

    cy.changeLanguage('pt')
    cy.contains(publishButton, 'Publicar')

    cy.changeLanguage('de')
    cy.contains(publishButton, 'Publizieren')
  })
})
