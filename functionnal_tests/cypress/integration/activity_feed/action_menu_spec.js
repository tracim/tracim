import { PAGES, URLS } from '../../support/urls_commands'

let workspaceId
let fileId
const fileTitle = 'FileTitle'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'

describe('At the space recent activities page', () => {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId).then(content => {
        fileId = content.content_id
      })
    })
  })

  beforeEach(() => {
    cy.loginAs('administrators')
    cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, params: { workspaceId }, waitForTlm: true })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('the action menu', () => {
    it('should show a flash message if user click at Copy content link', () => {
      cy.contains('[data-cy=FilenameWithExtension__label]', fileTitle)
      cy.get('.feedItemHeader__actionMenu').click()
      cy.contains('.feedItemHeader__actionMenu__item', 'Copy content link').click()
      cy.contains('.flashmessage__container__content__text__paragraph', 'Link copied to clipboard')
    })
  })
})
