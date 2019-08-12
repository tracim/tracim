import { SELECTORS as s, formatTag } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands.js'

describe('App File', () => {
  const fileTitle_1 = 'file-1'
  const fileTitle_2 = 'file-2'
  const fullFilename_1 = 'Linux-Free-PNG.png'
  const fullFilename_2 = 'artikodin.png'
  const contentType = 'image/png'
  let workspaceId
  let firstContentId
  let secondContentId

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')

    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename_1, contentType, fileTitle_1, workspace.workspace_id)
        .then(newContent => firstContentId = newContent.content_id)

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
      it('should open app in VIEW mode', () => {
        cy.visitPage({
          pageName: p.CONTENT_OPEN,
          params: { workspaceId: workspaceId, contentType: 'file', contentId: secondContentId }
        })

        cy.get('[data-cy="revision_data_2"')
          .click()

        cy.get('[data-cy="appFileLastVersionBtn"]')
          .should('be.visible')

        cy.get('[data-cy="popinFixed__header__button__close"]')
          .click()

        cy.get('[data-cy="popinFixed"]')
          .should('not.be.visible')

        const contentFile1Getter = formatTag({selectorName: s.CONTENT_IN_LIST, attrs: {title: fileTitle_1}})
        cy.get(contentFile1Getter)
          .click()

        cy.get('[data-cy="popinFixed"]')
          .should('be.visible')

        cy.get('[data-cy="appFileLastVersionBtn"]')
          .should('be.not.visible')
      })
    })
  })
})
