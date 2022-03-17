import { SELECTORS as s, formatTag } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands.js'

describe('App File', () => {
  const fileTitle_1 = 'file-1'
  const fileTitle_2 = 'file-2'
  const fullFilename_1 = 'Linux-Free-PNG.png'
  const fullFilename_2 = 'artikodin.png'
  const contentType = 'image/png'
  let workspaceId
  let secondContentId

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')

    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename_1, contentType, fileTitle_1, workspace.workspace_id)

      cy.createFile(fullFilename_2, contentType, fileTitle_2, workspaceId)
        .then(newContent => {
          secondContentId = newContent.content_id
          cy.updateFile(fullFilename_2, contentType, workspaceId, newContent.content_id, newContent.filename)
        })
    })
  })

  afterEach(() => cy.cancelXHR())

  describe('Switching between 2 content type Files', () => {
    describe('While being in mode REVISION', () => {
      it('should open app in VIEW mode and update the breadcrumbs correctly', () => {
        cy.visitPage({
          pageName: p.CONTENT_OPEN,
          params: { contentId: secondContentId }
        })

        cy.contains('.breadcrumbs__item', fileTitle_2).should('be.visible')

        cy.get('[data-cy="revision_data_2"]')
          .click()

        cy.get('[data-cy="appFileLastVersionBtn"]')
          .should('be.visible')

        cy.get('.file__contentpage__header__close')
          .click()

        cy.contains('.breadcrumbs__item', 'Contents')

        cy.get('[data-cy="popinFixed"]')
          .should('not.be.visible')

        const contentFile1Getter = formatTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileTitle_1 } })
        cy.get(contentFile1Getter)
          .click()

        cy.get('[data-cy="popinFixed"]')
          .should('be.visible')

        cy.get('[data-cy="appFileLastVersionBtn"]')
          .should('be.not.visible')

        cy.get(formatTag({ selectorName: s.SIDEBAR_ARROW }))
          .click()

        cy.get('.file__contentpage__header ul > li.breadcrumbs__item.primaryColorFont.primaryColorFontDarkenHover')
          .click()

        cy.get('[data-cy="popinFixed"]')
          .should('not.be.visible')
      })
    })
  })

  describe('Open file with different role', () => {
    it('should display the download share button when the user is logged as space manager', () => {
      cy.loginAs('administrators')
      cy.visitPage({
        pageName: p.CONTENT_OPEN,
        params: { contentId: secondContentId }
      })
      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .get('[data-cy=popin_right_part_share]').should('be.visible')
    })

    it('should not display the download share button when the user is logged as contributor', () => {
      cy.loginAs('users')
      cy.visitPage({
        pageName: p.CONTENT_OPEN,
        params: { contentId: secondContentId }
      })
      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .get('[data-cy=popin_right_part_share]').should('be.not.visible')
    })
  })
})
