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

  it('should have emoji reaction button', () => {
    cy.get('.EmojiReactionButton__buttonpicker')
      .should('be.enabled')
      .click()
    cy.get('.EmojiPickerPopover .popover').should('be.visible')
  })

  it('should be possible to comment a publication', () => {
    cy.get('#wysiwygTimelineComment1')
      .should('be.visible')
      .type(text)
    cy.get('.timeline__texteditor__submit__btn')
      .should('be.enabled')
      .click()
    cy.contains('.feedItem__publication__messagelist__item .comment__body__content__text', text)
  })

  describe('in the action menu', () => {
    beforeEach(function () {
      cy.get('.feedItemHeader__actionMenu').click()
    })

    it('should be able to copy content link', () => {
      cy.get('.feedItemHeader__actionMenu__item[title="Copy content link"]').click()
      cy.contains('.flashmessage__container__content__text__paragraph', 'The link has been copied to clipboard')
    })

    it('should be able to edit publication', () => {
      cy.contains('.feedItem__publication__body__content__text', text)
      cy.get('.feedItemHeader__actionMenu__item[title="Edit"]').click()
      cy.get('.editCommentPopup__title').should('be.visible')
      cy.assertTinyMCEContent(text)
      cy.typeInTinyMCE(`${text}!`)
      cy.contains('.iconbutton__text_with_icon', 'Send').click()
      cy.contains('.feedItem__publication__body__content__text', `${text}!`)
    })

    it('should be able to open as a content', () => {
      cy.get('.feedItemHeader__actionMenu__item[title="Open as content"]').click()
      cy.url().should('include', '/contents')
    })
  })
})
