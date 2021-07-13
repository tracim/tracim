import { PAGES } from '../../support/urls_commands'

const EMOJI_MART_SELECTOR = 'section.emoji-mart.emoji-mart-light'
const commentContent = 'hello'

const fullFilename = 'Linux-Free-PNG.png'
const mimeType = 'image/png'

const contentName = 'Title'
const headerClassName = '.wsContentGeneric__header'
const emojiCounterClassName = '.EmojiReactionButton__button__count'
const emojiButtonClassName = '.EmojiReactionButton__button'
const emojiValueClassName = '.EmojiReactionButton__button__value'

let workspaceId
const contentIdByType = {}

function addEmojiReaction (container, title, emoji) {
  cy.get(`${container} .EmojiReactionButton__buttonpicker`)
    .click()
  cy.get(EMOJI_MART_SELECTOR)
    .should('be.visible')
  cy.get(`button.emoji-mart-emoji[title='${title}']`)
    .first()
    .click()
  cy.get(EMOJI_MART_SELECTOR)
    .should('not.exist')
  cy.get(`${container} ${emojiButtonClassName}.highlighted`)
    .should('be.visible')
  cy.contains(`${container} ${emojiValueClassName}`, emoji)
}

describe('Reactions', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id

      cy.createThread(`${contentName}Thread`, workspaceId).then(({ content_id: contentId }) => {
        contentIdByType['thread'] = contentId
        cy.createComment(workspaceId, contentId, commentContent)
      })

      cy.createHtmlDocument(`${contentName}Note`, workspaceId).then(({ content_id: contentId }) => {
        contentIdByType['html-document'] = contentId
      })

      cy.createFile(fullFilename, mimeType, `${contentName}File`, workspaceId).then(({ content_id: contentId }) => {
        contentIdByType['file'] = contentId
      })
    })
  })

  describe('In a thread', () => {
    before(() => {
      const contentType = 'thread'
      const contentId = contentIdByType[contentType]
      cy.loginAs('administrators')
      cy.visitPage({
        pageName: PAGES.CONTENT_OPEN,
        params: { workspaceId, contentType, contentId },
        waitForTlm: true
      })
    })

    const container = '.comment__footer'

    it('should allow creating and deleting reactions in a comment', () => {
      cy.get(`.comment__footer ${emojiButtonClassName}`)
        .should('not.exist')

      addEmojiReaction(container, 'grinning', '😀')
      cy.contains(`${container} ${emojiCounterClassName}`, '1')
      cy.get(`${container} ${emojiCounterClassName}`).should('have.length', 1)

      addEmojiReaction(container, '+1', '👍')
      cy.contains(`${container} ${emojiCounterClassName}`, '1')

      cy.get(`${container} ${emojiButtonClassName}`)
        .first()
        .click()

      cy.get(`${container} ${emojiButtonClassName}`)
        .last()
        .click()

      cy.get(`${container} ${emojiButtonClassName}`)
        .should('not.exist')
    })
  })

  describe('In each app', () => {
    const container = headerClassName
    for (const contentType of ['file', 'html-document', 'thread']) {
      it('should allow creating and deleting reactions with an existing reaction in a ' + contentType, () => {
        const contentId = contentIdByType[contentType]
        cy.loginAs('administrators')
        cy.visitPage({
          pageName: PAGES.CONTENT_OPEN,
          params: { workspaceId, contentType, contentId },
          waitForTlm: true
        })
        cy.contains('.wsContentGeneric__header__title', contentName)

        addEmojiReaction(headerClassName, 'grinning', '😀')
        cy.contains(`${container} ${emojiValueClassName}`, '😀')
        cy.contains(`${container} ${emojiCounterClassName}`, '1')

        cy.get(`${container} ${emojiButtonClassName}`).click()
        cy.get(`${container} ${emojiButtonClassName}`)
          .should('not.exist')
      })
    }
  })

  describe('In the recent activities', () => {
    before(() => {
      cy.loginAs('administrators')
      cy.visitPage({
        pageName: PAGES.CONTENT_OPEN,
        params: { workspaceId, contentType: 'file', contentId: contentIdByType['file'] }
      })
      cy.contains('.wsContentGeneric__header__title', contentName)
      addEmojiReaction(headerClassName, 'grinning', '😀')
    })

    const container = '.feedItemFooter__right'
    it('should allow creating and deleting reactions', () => {
      cy.loginAs('users')
      cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, params: { workspaceId }, waitForTlm: true })

      cy.contains(`${container} ${emojiValueClassName}`, '😀')
      cy.contains(`${container} ${emojiCounterClassName}`, '1')

      cy.get(`${container} ${emojiButtonClassName}`).first().click()
      cy.contains(`${container} ${emojiCounterClassName}`, '2')

      cy.get(`${container} ${emojiButtonClassName}`).first().click()
      cy.contains(`${container} ${emojiCounterClassName}`, '1')
    })
  })
})
