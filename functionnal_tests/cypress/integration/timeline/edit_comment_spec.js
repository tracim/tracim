import { PAGES } from '../../support/urls_commands'

const submitButton = '.thread__contentpage__texteditor__submit__btn'
const text = 'some text'
const threadTitle = 'threadTitle'

describe('Timeline', () => {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then((workspace) => {
      cy.createThread(threadTitle, workspace.workspace_id).then(thread => {
        cy.visitPage({
          pageName: PAGES.CONTENT_OPEN,
          params: { workspaceId: workspace.workspace_id, contentType: 'thread', contentId: thread.content_id }
        })
      })
      cy.get('#wysiwygTimelineComment').type(text)
      cy.contains(submitButton, 'Send').click()
    })
  })

  describe('edit a comment', () => {
    it.skip('should show new comment', () => {
      // FIXME - RJ - 2022-02-16 - disabled test (see #5436)
      cy.get('.comment__body__content__header__actions').click()
      cy.contains('.comment__body__content__textAndPreview', text)
      cy.get('.iconbutton[title="Edit comment"]').click()
      cy.get('.cardPopup__header__title').should('be.visible')
      cy.waitForTinyMCELoaded()
        .then(() => cy.typeInTinyMCE(`${text}!`))
      cy.contains('.editCommentPopup__buttons .iconbutton__text_with_icon', 'Send').click()
      cy.contains('.comment__body__content__textAndPreview', `${text}!`)
    })
  })
})
