import { PAGES } from '../../support/urls_commands'

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
      cy.get('#wysiwygTimelineCommentPublication').type(text)
      cy.contains(publishButton, 'Publish').click()
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
    cy.get('#wysiwygTimelineComment1')
      .should('be.visible')
      .type(text)
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

    it.skip('should be able to edit publication', () => {
      // FIXME - RJ - 2022-02-16 - disabled test (see #5436)
      cy.contains('.feedItem__publication__body__content__text', text)
      cy.get('.feedItemHeader__actionMenu__item[title="Edit"]').click()
      cy.get('.cardPopup__header__title').should('be.visible')
      cy.waitForTinyMCELoaded().then(() => {
        cy.typeInTinyMCE(`${text}!`)
        cy.contains('.editCommentPopup__buttons .iconbutton', 'Send').click()
        cy.contains('.feedItem__publication__body__content__text', `${text}!`)
      })
    })

    it('should be able to open as a content', () => {
      cy.get('.feedItemHeader__actionMenu__item[title="Open as content"]').click()
      cy.url().should('include', '/contents')
    })
  })
})
