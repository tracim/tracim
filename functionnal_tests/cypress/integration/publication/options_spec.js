import { PAGES } from '../../support/urls_commands'
import { SELECTORS } from '../../support/generic_selector_commands'

const publishButton = '.commentArea__submit__btn'
const sendButton = '[data-cy=commentArea__comment__send]'
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

  it('should have emoji reaction button', () => {
    cy.get('.EmojiReactionButton__buttonpicker')
      .should('be.enabled')
      .click()
    cy.get('.EmojiPickerPopover .popover').should('be.visible')
  })

  it('should be possible to comment a publication', () => {
    cy.contains('.buttonComments', 'Comment').should('be.visible').click()
    cy.inputInTinyMCE(text)
    cy.contains(sendButton, 'Send')
      .should('be.enabled')
      .click()
    cy.contains('.feedItem__publication__messagelist__item .timeline__comment__body__content__text', text)
  })

  describe('in the action menu', () => {
    beforeEach(function () {
      cy.get('.feedItemHeader__actionMenu').click()
    })

    it('should be able to copy content link', () => {
      cy.get('.feedItemHeader__actionMenu__item[title="Copy content link"]').click()
      cy.get('.flashmessage__container .bg-info').should('be.visible')
    })

    it('should be able to edit publication', () => {
      cy.contains('.feedItem__publication__body__content__text', text)
      cy.get('.feedItemHeader__actionMenu__item[title="Edit"]').click()
      cy.get('.cardPopup__header__title').should('be.visible')
      cy.inputInTinyMCE(`${text}!`)
      cy.contains('.editCommentPopup__texteditor__submit > .commentArea__submit__btn', 'Send')
        .click()
      cy.contains('.feedItem__publication__body__content__text', `${text}!`)
    })

    it('should be able to open as a content', () => {
      cy.get('.feedItemHeader__actionMenu__item[title="Open as content"]').click()
      cy.url().should('include', '/contents')
      // INFO - CH - 2023-10-25 - adding wait() here because without it, the test randomly fails because of an error related
      // to tinymce. It is possible that redirection in the test followed by the redirection of the afterEach is the reason
      cy.wait(1000)
    })
  })
})
