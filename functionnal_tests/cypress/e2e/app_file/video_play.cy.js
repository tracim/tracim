import { PAGES as p } from '../../support/urls_commands'

const fileTitle = 'FileTitle'
const fullFilename = 'video.mp4'
const contentType = 'video/mp4'

const pageWidth = Cypress.config().viewportWidth
const pageHeight = Cypress.config().viewportHeight

let workspaceId, contentId

describe('Play a video file', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId)
        .then(newContent => {
          contentId = newContent.content_id
        })
    })
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visitPage({ pageName: p.CONTENT_OPEN, params: { contentId } })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  it('should display the video', () => {
    cy.contains('[data-cy=FilenameWithBadges__label]', fileTitle)
    cy.get('[data-cy=dropdownContentButton]').click()
    cy.get('[data-cy=popinListItem__playVideo').click()
    cy.get('#videoWrapperDiv > video').should('be.visible')
  })

  it('should display the warning message bellow the video', () => {
    cy.contains('[data-cy=FilenameWithBadges__label]', fileTitle)
    cy.get('[data-cy=dropdownContentButton]').click()
    cy.get('[data-cy=popinListItem__playVideo').click()
    cy.get('#videoWrapperDiv .file__previewVideo__error').should('be.visible')
  })

  it('should display the full video in fullscreen', () => {
    cy.contains('[data-cy=FilenameWithBadges__label]', fileTitle)
    cy.get('[data-cy=dropdownContentButton]').click()
    cy.get('[data-cy=popinListItem__playVideo').click()
    cy.get('#videoWrapperDiv > video')
      .should('be.visible')
      .invoke('outerWidth')
      .should('be.lte', pageWidth)
    cy.get('#videoWrapperDiv > video')
      .should('be.visible')
      .invoke('height')
      .should('be.lte', pageHeight)
  })
})
