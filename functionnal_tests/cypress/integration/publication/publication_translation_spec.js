import { PAGES } from '../../support/urls_commands'

const publishButton = '.commentArea__submit__btn'
const text = 'Hello, world'

describe('Publications', () => {
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

  afterEach(() => {
    cy.cancelXHR()
  })

  it('A translation button should be visible', () => {
    cy.get('[data-cy=commentTranslateButton]').click()
    cy.contains('.feedItem__publication', 'en')
    cy.get('[data-cy=commentTranslateButton]').click()
    cy.contains('.feedItem__publication', text)
  })

  it('a menu should allow to change the target language', () => {
    cy.get('[data-cy=commentTranslateButton__languageMenu]').click()
    cy.get('[data-cy=commentTranslateButton__language__fr]').click()
    cy.get('[data-cy=commentTranslateButton]').click()
    cy.contains('.feedItem__publication', 'fr')
  })
})
