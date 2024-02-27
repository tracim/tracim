import { PAGES } from '../../support/urls_commands.js'
import { SELECTORS } from '../../support/generic_selector_commands.js'

const publishButton = '.commentArea__submit__btn'
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
    })
  })

  it("should change button's label according to its state", () => {
    cy.inputInTinyMCE(text)
    cy.contains(publishButton, 'Publish').click()
    cy.getTag({ selectorName: SELECTORS.CARD_POPUP_BODY })
          .get('[data-cy=popup__createcontent__form__button]')
          .click()
    cy.contains('[data-cy=timeline__comment__body__content__text]', text)
    cy.contains('.buttonComments', 'Comment').should('be.visible').click()
    cy.inputInTinyMCE(text)
    cy.contains('.feedItem__timeline__texteditor__submit__btn', 'Send')
      .should('be.visible')
      .click()
    cy.contains('.feedItem__timeline__comment__body__content .feedItem__timeline__comment__body__content__text', text)
    cy.contains('.buttonComments', 'Hide discussion').should('be.visible').click()
    cy.contains('.buttonComments', 'Show discussion (1)').should('be.visible').click()
  })
})
