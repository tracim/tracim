import { PAGES as p } from '../../support/urls_commands'

describe('The app file', function () {
  let contentId
  const filename = 'the_pdf.pdf'
  const filenameWithoutExtension = 'the_pdf'
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').then(workspace => {
      cy.createFile(filename, 'file', filenameWithoutExtension, workspace.workspace_id).then(file => {
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

  describe('the action menu', () => {
    it('should show a flash message if user click at Copy content link', () => {
      cy.contains('[data-cy=FilenameWithBadges__label]', filenameWithoutExtension)
      cy.get('.wsContentGeneric__header__actions').click()
      cy.get('[data-cy=popinListItem__copyLink]').click()
      cy.get('.flashmessage__container .bg-info').should('be.visible')
    })
  })
})
