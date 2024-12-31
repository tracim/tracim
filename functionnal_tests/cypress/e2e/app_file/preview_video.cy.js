import { PAGES as p } from '../../support/urls_commands'

const fileTitle = 'FileTitle'
const fullFilename = 'video.mp4'
const contentType = 'video/mp4'

let contentId

describe('A video file', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.createFile(fullFilename, contentType, fileTitle, workspace.workspace_id)
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

  it('should not display more than one preview page', () => {
    cy.contains('[data-cy=FilenameWithBadges__label]', fileTitle)
    cy.get('.previewcomponent__fileimg').should('be.visible')
    cy.get('.previewcomponent__pagecount').should('be.not.visible')
    cy.get('.previewcomponent__navigationButton').should('be.not.visible')
  })

  it('should display the video player when clicking on preview', () => {
    cy.contains('[data-cy=FilenameWithBadges__label]', fileTitle).then(() => {
      cy.get('.previewcomponent__fileimg__text').should('be.not.visible')
      cy.get('.previewcomponent__fileimg').should('be.visible').click()
      cy.get('#videoWrapperDiv > video').should('be.visible')
    })
  })
})
