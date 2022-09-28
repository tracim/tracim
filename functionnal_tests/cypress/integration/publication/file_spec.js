import { PAGES } from '../../support/urls_commands'
import { SELECTORS } from '../../support/generic_selector_commands'

const publicationInput = '#wysiwygTimelineCommentPublication'
const publishButton = '.commentArea__submit__btn'
const addFileButton = '.AddFileToCommentButton'

const pngFile = 'artikodin.png'
const fileName = 'file_exemple1'
const exampleText = 'This is an example'

describe('Publications', () => {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe('publish a file', () => {
    beforeEach(function () {
      cy.fixture('baseWorkspace').as('workspace').then((workspace) => {
        cy.visitPage({
          pageName: PAGES.PUBLICATION,
          params: { workspaceId: workspace.workspace_id },
          waitForTlm: true
        })
        cy.get('.emptyListMessage__text').should('be.visible')
        cy.get(addFileButton).click()
        cy.dropFixtureInDropZone(pngFile, 'image/png', '.filecontent__form', `${fileName}.png`)
        cy.contains('.file__upload__list__item__label', fileName)
        cy.getTag({ selectorName: SELECTORS.CARD_POPUP_BODY })
          .get('[data-cy=popup__createcontent__form__button]')
          .click()
        cy.contains('.DisplayFileToUpload__message__text', '1')
        cy.contains(publishButton, 'Publish').click()
      })
    })

    afterEach(() => {
      cy.cancelXHR()
    })

    it('should show image as preview', () => {
      cy.get('.CommentFilePreview img').should('be.visible')
    })

    it('should have a download attribute in the preview', () => {
      cy.get('.CommentFilePreview').should('have.attr', 'download')
    })

    it('open as a thread', () => {
      cy.get('.feedItemHeader__actionMenu').click()
      cy.get('.feedItemHeader__actionMenu__item[title="Open as content"]').click()

      cy.url().should('include', '/contents')
      cy.contains('.wsContentGeneric__header__title', 'News')
      cy.get('.thread__contentpage__comment').should('be.visible')
      cy.get('.CommentFilePreview').should('be.visible')
      cy.contains('.attachedFile', fileName)
      cy.get('.CommentFilePreview > img').should('be.visible')

      cy.get('.thread__contentpage__header__icon').should('be.visible')
    })
  })

  describe('publish a file with a text', () => {
    beforeEach(function () {
      cy.fixture('baseWorkspace').as('workspace').then((workspace) => {
        cy.visitPage({
          pageName: PAGES.PUBLICATION,
          params: { workspaceId: workspace.workspace_id },
          waitForTlm: true
        })
        cy.get('.emptyListMessage__text').should('be.visible')
        cy.get(addFileButton).click()
        cy.dropFixtureInDropZone(pngFile, 'image/png', '.filecontent__form', `${fileName}.png`)
        cy.contains('.file__upload__list__item__label', fileName)
        cy.getTag({ selectorName: SELECTORS.CARD_POPUP_BODY })
          .get('[data-cy=popup__createcontent__form__button]')
          .click()
        cy.contains('.DisplayFileToUpload__message__text', '1')
        cy.get(publicationInput).type(exampleText)
        cy.contains(publishButton, 'Publish').click()
      })
    })

    afterEach(() => {
      cy.cancelXHR()
    })

    it('should show text as preview', () => {
      cy.contains('.comment__body__content__text', exampleText).should('be.visible')
    })

    it('should show image as comment', () => {
      cy.get('.buttonComments').should('be.visible').click()
      cy.get('.CommentFilePreview').should('be.visible')
    })

    describe('open as a thread', () => {
      it('should be able to comment a file', () => {
        cy.get('.feedItemHeader__actionMenu').click()
        cy.get('.feedItemHeader__actionMenu__item[title="Open as content"]').click()

        cy.url().should('include', '/contents')
        cy.contains('.attachedFile', fileName)
        cy.get('.CommentFilePreview > img').should('be.visible')

        cy.get('.AddFileToCommentButton').click()
        cy.dropFixtureInDropZone(pngFile, 'image/png', '.filecontent__form', `${fileName}2.png`)
        cy.getTag({ selectorName: SELECTORS.CARD_POPUP_BODY })
          .get('[data-cy=popup__createcontent__form__button]')
          .click()
        cy.contains('.commentArea__submit__btn', 'Send').click()

        cy.contains('.attachedFile', `${fileName}2`)
        cy.get('.CommentFilePreview > img').should('be.visible')
      })
    })
  })

  // INFO - G.B. - 2021-07-13 - The file name is based in time, so we use wait to be sure
  // that we have at least a second between files
  it('should be able to publish multiple times the same file', () => {
    cy.fixture('baseWorkspace').as('workspace').then((workspace) => {
      cy.visitPage({
        pageName: PAGES.PUBLICATION,
        params: { workspaceId: workspace.workspace_id },
        waitForTlm: true
      })
      cy.get('.emptyListMessage__text').should('be.visible')
      cy.get(addFileButton).click()
      cy.dropFixtureInDropZone(pngFile, 'image/png', '.filecontent__form', `${fileName}.png`)
      cy.getTag({ selectorName: SELECTORS.CARD_POPUP_BODY })
        .get('[data-cy=popup__createcontent__form__button]')
        .click()
      cy.contains(publishButton, 'Publish').click()
      cy.wait(1000)
      cy.get(addFileButton).click()
      cy.dropFixtureInDropZone(pngFile, 'image/png', '.filecontent__form', `${fileName}.png`)
      cy.getTag({ selectorName: SELECTORS.CARD_POPUP_BODY })
        .get('[data-cy=popup__createcontent__form__button]')
        .click()
      cy.contains(publishButton, 'Publish').click()

      cy.get('.feedItem').should('have.length.gt', 1)
    })
  })
})
