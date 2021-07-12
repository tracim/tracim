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
    it('should show new comment', () => {
      cy.get('.comment__body__content__header__actions').click()
      cy.contains('.comment__body__content__textAndPreview', text)
      cy.get('.iconbutton[title="Edit comment"]').click()
      cy.get('.editCommentPopup__title').should('be.visible')
      cy.typeInTinyMCE(`${text}!`)
      cy.contains('.iconbutton__text_with_icon', 'Send').click()
      cy.contains('.comment__body__content__textAndPreview', `${text}!`)
    })
  })
})
