import { PAGES } from '../../support/urls_commands'

const EMOJI_MART_SELECTOR = 'section.emoji-mart.emoji-mart-light'
const threadTitle = 'Title'
const commentContent = 'hello'

const htmlDocTitle = 'Note'
const fullFilename = 'Linux-Free-PNG.png'
const mimeType = 'image/png'
const fileTitle = 'A file'

const appContentRightMenuClassName = '.appContentRightMenu'

let workspaceId
const contentIdByType = {}

function addEmojiReaction (container, title, emoji) {
  cy.get(container + ' .EmojiReactionButton__buttonpicker')
    .click()
  cy.get(EMOJI_MART_SELECTOR)
    .should('be.visible')
  cy.get(`button.emoji-mart-emoji[title='${title}']`)
    .first()
    .click()
  cy.get(EMOJI_MART_SELECTOR)
    .should('not.exist')
  cy.get(container + ' .EmojiReactionButton__button.highlighted')
    .should('be.visible')
  cy.get(container + ' .EmojiReactionButton__button__value')
    .contains(emoji)
}

function addAdminEmoji (contentType, contentId) {
  contentIdByType[contentType] = contentId
  cy.visitPage({
    pageName: PAGES.CONTENT_OPEN,
    params: { workspaceId, contentType, contentId }
  })

  addEmojiReaction(appContentRightMenuClassName, 'grinning', '😀')
}

describe('Reactions', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id

      cy.createThread(threadTitle, workspaceId).then(({ content_id: contentId }) => {
        addAdminEmoji('thread', contentId)
        cy.get('.timeline__texteditor__textinput #wysiwygTimelineComment')
          .type(commentContent)
        cy.get('.timeline__texteditor__submit__btn')
          .click()
      })

      cy.createHtmlDocument(htmlDocTitle, workspaceId).then(({ content_id: contentId }) => {
        addAdminEmoji('html-document', contentId)
      })

      cy.createFile(fullFilename, mimeType, fileTitle, workspaceId).then(({ content_id: contentId }) => {
        addAdminEmoji('file', contentId)
      })
    })
  })

  describe('In a thread', () => {
    beforeEach(() => {
      const contentType = 'thread'
      const contentId = contentIdByType[contentType]
      cy.loginAs('users')
      cy.visitPage({
        pageName: PAGES.CONTENT_OPEN,
        params: { workspaceId, contentType, contentId }
      })
    })

    for (const [container, containerName] of [
      [appContentRightMenuClassName, 'a content'],
      ['.comment__footer', 'a comment']
    ]) {
      it('should allow creating and deleting reactions in ' + containerName, () => {
        cy.get(container + ' .EmojiReactionButton__button')
          .should('not.exist')
        addEmojiReaction(container, 'grinning', '😀')
        cy.get(container + ' .EmojiReactionButton__button__count')
          .contains('1')
        addEmojiReaction(container, '+1', '👍')
        cy.get(container + ' .EmojiReactionButton__button__count')
          .contains('1')
        cy.get(container + ' .EmojiReactionButton__button')
          .first()
          .click()
        cy.get(container + ' .EmojiReactionButton__button')
          .last()
          .click()
        cy.get(container + ' .EmojiReactionButton__button')
          .should('not.exist')
      })
    }
  })

  describe('In a file and a note', () => {
    const container = appContentRightMenuClassName
    for (const contentType of ['file', 'html-document']) {
      it('should allow creating and deleting reactions with an existing reaction in a ' + contentType, () => {
        const contentId = contentIdByType[contentType]
        cy.loginAs('users')
        cy.visitPage({
          pageName: PAGES.CONTENT_OPEN,
          params: { workspaceId, contentType, contentId }
        })
        cy.get(container + ' .EmojiReactionButton__button__value')
          .contains('😀')
        cy.get(container + ' .EmojiReactionButton__button__count')
          .contains('1')

        cy.get(container + ' .EmojiReactionButton__button').click()
        cy.get(container + ' .EmojiReactionButton__button__count')
          .contains('2')
        cy.get(container + ' .EmojiReactionButton__button').click()
        cy.get(container + ' .EmojiReactionButton__button__count')
          .contains('1')
      })
    }
  })
})
