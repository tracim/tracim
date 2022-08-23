import { PAGES as p } from '../../support/urls_commands'

context('The app file', function () {
  let pdfId
  const pdfFilename = 'the_pdf.pdf'
  const pdfName = 'the_pdf'
  const pdfType = 'application/pdf'

  let videoId
  const videoFilename = 'video.mp4'
  const videoName = 'video'
  const videoType = 'video/mp4'

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').then(workspace => {
      cy.createFile(pdfFilename, pdfType, pdfName, workspace.workspace_id).then(file => pdfId = file.content_id)
      cy.createFile(videoFilename, videoType, videoName, workspace.workspace_id).then(file => videoId = file.content_id)
    })
  })


  beforeEach(function () {
    cy.loginAs('administrators')
  })


  afterEach(function () {
    cy.cancelXHR()
  })

  describe('when type is PDF', () => {
    it('should have a Upload a new version button on header', () => {
      cy.visitPage({ pageName: p.CONTENT_OPEN, params: { contentId: pdfId } })
      cy.get('[data-cy=newVersionBtn]').should('be.visible')
    })
  })

  describe('when type is MP4 (video)', () => {
    it('should have a Upload a new version button on header', () => {
      cy.visitPage({ pageName: p.CONTENT_OPEN, params: { contentId: videoId } })
      cy.get('[data-cy=popinListItem__playVideo]').should('be.visible')
    })
  })
})
