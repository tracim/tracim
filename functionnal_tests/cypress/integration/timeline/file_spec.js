import { PAGES } from '../../support/urls_commands'
import { SELECTORS } from '../../support/generic_selector_commands'

const submitButton = '.thread__contentpage__texteditor__submit__btn'
const addFileButton = '.AddFileToCommentButton'

const pngFile = 'artikodin.png'
const fileName = 'file_exemple1'

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
      cy.get(addFileButton).should('be.enabled').click()
      cy.dropFixtureInDropZone(pngFile, 'image/png', '.filecontent__form', `${fileName}.png`)
      cy.getTag({ selectorName: SELECTORS.CARD_POPUP_BODY })
        .get('[data-cy=popup__createcontent__form__button]')
        .click()
      cy.contains(submitButton, 'Send').click()
    })
  })

  describe('publish a file', () => {
    it('should show image as preview', () => {
      cy.get('.CommentFilePreview img').should('be.visible')
    })

    it('should have a download attribute in the preview', () => {
      cy.get('.CommentFilePreview').should('have.attr', 'download')
    })

    it('should be able to open as a content', () => {
      cy.get('.comment__body__content__header__actions').click()
      cy.get('.iconbutton[title="Open as content"]').click()
      cy.url().should('include', '/contents/file')
    })
  })
})
