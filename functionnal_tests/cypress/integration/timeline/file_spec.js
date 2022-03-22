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
          params: { contentId: thread.content_id }
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

  // INFO - G.B. - 2021-07-13 - The file name is based in time, so we use wait to be sure
  // that we have at least a second between files
  it('should be able to publish multiple times the same file', () => {
    cy.wait(1000)
    cy.get(addFileButton).click()
    cy.dropFixtureInDropZone(pngFile, 'image/png', '.filecontent__form', `${fileName}.png`)
    cy.getTag({ selectorName: SELECTORS.CARD_POPUP_BODY })
      .get('[data-cy=popup__createcontent__form__button]')
      .click()
    cy.contains(submitButton, 'Send').click()

    cy.get('.comment').should('have.length.gt', 1)
  })
})
