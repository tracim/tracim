import { PAGES, URLS } from '../../support/urls_commands'

let workspaceId
let contentId
const noteTitle = 'noteTitle'
const noteTitle2 = 'noteTitle2'
const fileTitle = 'fileTitle'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'
const commentContent = 'commentContent'

describe('At the space recent activities page', () => {
  beforeEach(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createHtmlDocument(noteTitle, workspaceId).then(content => {
        contentId = content.content_id
        cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, params: { workspaceId }, waitForTlm: true })
      })
    })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('if the activity does not have comments', () => {
    it('should show a participate button that redirects to app', () => {
      cy.contains('[data-cy=FilenameWithBadges__label]', noteTitle)
      cy.get('.feedItemFooter__right__participate').click()
      cy.contains('.html-document__contentpage__edition__header__title', noteTitle)
    })
  })

  describe('if the activity have a  comment and an attached file and we click at "show discussion" button', () => {
    it('should show the associated the attached file', () => {
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId, contentId).then(() => {
        cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, params: { workspaceId }, waitForTlm: true })
        cy.contains('.buttonComments', '1')
        cy.contains('[data-cy=FilenameWithBadges__label]', noteTitle)
        cy.get('.buttonComments').click()
        cy.contains('.attachedFile', fileTitle)
        cy.get('.CommentFilePreview > img').should('be.visible')
      })
    })

    it('should show the associated comments', () => {
      cy.createComment(workspaceId, contentId, commentContent).then(() => {
        cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, params: { workspaceId }, waitForTlm: true })
        cy.contains('[data-cy=FilenameWithBadges__label]', noteTitle)
        cy.get('.buttonComments').click()
        cy.contains('[data-cy=comment__body__content__text]', commentContent)
      })
    })

    it('should show a participate button that redirects to app', () => {
      cy.createComment(workspaceId, contentId, commentContent).then(() => {
        cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, params: { workspaceId }, waitForTlm: true })
        cy.contains('[data-cy=FilenameWithBadges__label]', noteTitle)
        cy.get('.buttonComments').click()
        cy.get('.timeline__participate').click()
        cy.contains('.html-document__contentpage__edition__header__title', noteTitle)
      })
    })
  })
})
