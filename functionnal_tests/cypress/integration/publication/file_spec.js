import { PAGES } from '../../support/urls_commands'
import { SELECTORS } from '../../support/generic_selector_commands'

const publicationInput = '#wysiwygTimelineCommentPublication'
const publishButton = '.publications__publishArea__buttons__submit'
const addFileButton = '.publications__publishArea__buttons__right .AddFileToCommentButton'

const pngFile = 'artikodin.png'
const fileName = 'file_exemple1'
const exampleText = 'This is an example'

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
      cy.get(addFileButton).click()
      cy.dropFixtureInDropZone(pngFile, 'image/png', '.filecontent__form', `${fileName}.png`)
      cy.getTag({ selectorName: SELECTORS.CARD_POPUP_BODY })
        .get('[data-cy=popup__createcontent__form__button]')
        .click()
      cy.get(publicationInput).type(exampleText)
      cy.contains(publishButton, 'Publish').click()
    })
  })

  describe('publish a file', () => {
    it('should show image as preview', () => {
      cy.get('.feedItem__preview__image img').should('be.visible')
    })

    it('should show text as comment', () => {
      cy.contains('.comment__body__content__text', exampleText).should('be.visible')
    })
  })
})
