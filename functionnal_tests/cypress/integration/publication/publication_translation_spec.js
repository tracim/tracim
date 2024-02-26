import { PAGES } from '../../support/urls_commands.js'
import { SELECTORS } from '../../support/generic_selector_commands.js'

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
      cy.inputInTinyMCE(text)
      cy.contains(publishButton, 'Publish').click()
      cy.getTag({ selectorName: SELECTORS.CARD_POPUP_BODY })
          .get('[data-cy=popup__createcontent__form__button]')
          .click()
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

  it('a menu should allow to change the target language and translate in one click', () => {
    cy.get('[data-cy=commentTranslateButton__languageMenu]').click()
    cy.get('[data-cy=commentTranslateButton__language__fr]').click()
    cy.contains('.feedItem__publication', 'fr')
  })
})
