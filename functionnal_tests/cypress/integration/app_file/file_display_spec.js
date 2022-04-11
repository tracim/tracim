import { PAGES as p } from '../../support/urls_commands'

context('Open a file', function () {
  let contentId
  const filename = 'the_pdf.pdf'
  const filenameWithoutExtension = 'the_pdf'
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').then(workspace => {
      cy.createFile(filename, 'file', filename, workspace.workspace_id).then(file => {
        contentId = file.content_id
      })
    })
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({ pageName: p.CONTENT_OPEN, params: { contentId: contentId } })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('File app', () => {
    it('should should display file name', () => {
      cy.contains('.FilenameWithExtension__label', filenameWithoutExtension)
    })

    it('should should display file extension', () => {
      cy.contains('.badge', '.pdf')
    })

    it('should should display page number', () => {
      cy.contains('.previewcomponent__pagecount', '1 of 2')
    })

    it('should should display next page navigation', () => {
      cy.get('.previewcomponent__navigationButton').should('be.visible')
    })
  })
})
